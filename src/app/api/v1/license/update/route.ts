import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { logApiRequest } from "@/lib/api-logger";
import { isRateLimitExpired } from "@/lib/rate-limit";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const startTime = Date.now();
  let statusCode = 200;
  let errorType: string | undefined = undefined;
  let licenseId: string | undefined = undefined;
  let builderId: string | undefined = undefined;
  let reqInstallationId: string | undefined = undefined;

  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  try {
    const body = await req.json();
    const { key, installationId } = body;
    reqInstallationId = installationId;

    if (!key) {
      statusCode = 400;
      errorType = "MISSING_PARAMS";
      return NextResponse.json({ success: false, message: "License key is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({
      where: { key },
      include: { product: true, builder: true, installations: true }
    });

    if (!license) {
      statusCode = 404;
      errorType = "INVALID_KEY";
      return NextResponse.json({ success: false, message: "Invalid license key" }, { status: 404 });
    }

    licenseId = license.id;
    builderId = license.builderId;

    // Check ALL disabled/frozen/locked states
    if (license.status === "Disabled" || license.status === "DISABLED" || license.status === "Deleted" || license.status === "FROZEN") {
      statusCode = 403;
      errorType = "LICENSE_DISABLED";
      return NextResponse.json({ success: false, message: `License is ${license.status.toLowerCase()}` }, { status: 403 });
    }

    if (license.isFrozen) {
      statusCode = 403;
      errorType = "LICENSE_FROZEN";
      return NextResponse.json({ success: false, message: "License is frozen" }, { status: 403 });
    }

    if (license.isLocked) {
      statusCode = 403;
      errorType = "LICENSE_LOCKED";
      return NextResponse.json({ success: false, message: "License is locked" }, { status: 403 });
    }

    // Checking expiry
    if (license.expiresAt && new Date() > license.expiresAt) {
      statusCode = 403;
      errorType = "EXPIRED";
      return NextResponse.json({ success: false, message: "License has expired" }, { status: 403 });
    }

    if (installationId) {
      // Check machine binding
      const existingInstall = license.installations.find((i: any) => i.installationId === installationId);
      if (!existingInstall) {
        statusCode = 403;
        errorType = "HOST_MISMATCH";
        return NextResponse.json({ success: false, error: "License is bound to another machine or unassigned" }, { status: 403 });
      }

      // Strict IP checking for already bound machines
      const isLocal = ipAddress === "::1" || ipAddress === "127.0.0.1" || ipAddress.includes("127.0.0.1");
      if (!isLocal && existingInstall.ipAddress && existingInstall.ipAddress !== ipAddress) {
        statusCode = 403;
        errorType = "IP_MISMATCH";
        return NextResponse.json({ success: false, error: "Machine IP address does not match the originally bound IP." }, { status: 403 });
      }
    }

    // Rate Limiting Check
    if (license.rateLimit && license.rateLimitWindow) {
      const now = new Date();
      const isExpired = isRateLimitExpired(license.rateLimitResetAt, license.rateLimitWindow);
      
      if (isExpired) {
        // Reset the window for the new calendar day/hour
        await prisma.license.update({ where: { id: license.id }, data: { rateLimitHits: 1, rateLimitResetAt: now } });
      } else {
        if (license.rateLimitHits >= license.rateLimit) {
          statusCode = 429;
          errorType = "RATE_LIMIT_EXCEEDED";
          return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
        } else {
          const newHits = (license.rateLimitHits || 0) + 1;
          await prisma.license.update({ where: { id: license.id }, data: { rateLimitHits: newHits } });
        }
      }
    }

    const { githubRepo, githubToken } = license.product;

    if (!githubRepo) {
      statusCode = 404;
      errorType = "NO_REPO";
      return NextResponse.json({ success: false, message: "No repository linked to this product" }, { status: 404 });
    }

    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Magneticx-Dev-Panel"
    };

    if (githubToken) {
      const { decryptString } = await import("@/lib/encryption");
      headers["Authorization"] = `Bearer ${decryptString(githubToken)}`;
    }

    const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`, {
      method: "GET",
      headers,
      cache: "no-store"
    });

    if (!response.ok) {
      if (response.status === 404) {
        statusCode = 404;
        errorType = "RELEASE_NOT_FOUND";
        return NextResponse.json({ success: false, message: "No releases found for this repository" }, { status: 404 });
      }
      statusCode = response.status;
      errorType = "GITHUB_ERROR";
      return NextResponse.json({ success: false, message: "Failed to fetch update from Github" }, { status: response.status });
    }

    const release = await response.json();
    const latestVersion = release.tag_name;
    let zipHash = license.product.latestZipHash;

    if (license.product.latestVersion !== latestVersion || !zipHash) {
      try {
        let downloadUrl = release.zipball_url;
        let dlHeaders: Record<string, string> = { ...headers };
        
        if (release.assets && release.assets.length > 0) {
          downloadUrl = release.assets[0].url;
          dlHeaders["Accept"] = "application/octet-stream";
        }
        
        const downloadRes = await fetch(downloadUrl, { method: "GET", headers: dlHeaders });
        if (downloadRes.ok && downloadRes.body) {
          const crypto = await import("crypto");
          const hash = crypto.createHash("sha256");
          const reader = downloadRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            hash.update(value);
          }
          zipHash = hash.digest("hex");
          
          await prisma.product.update({
            where: { id: license.product.id },
            data: { latestVersion, latestZipHash: zipHash }
          });
        }
      } catch (err) {
        console.error("Failed to compute hash", err);
      }
    }

    const responseData: any = {
      success: true,
      latest_version: release.tag_name,
      name: release.name,
      notes: release.body,
      published_at: release.published_at,
    };
    
    if (zipHash) {
      responseData.zip_hash = zipHash;
    }

    if (license.appSecret) {
      responseData.appSecret = license.appSecret;
    }

    if (license.product?.rsaPrivateKey) {
      const { decryptString } = await import("@/lib/encryption");
      const { signPayload } = await import("@/lib/rsa");
      
      try {
        const privateKeyPEM = decryptString(license.product.rsaPrivateKey);
        const signature = signPayload(responseData, privateKeyPEM);
        return NextResponse.json({
          data: responseData,
          signature
        });
      } catch (err) {
        console.error("Failed to sign payload", err);
      }
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    statusCode = 500;
    errorType = "SERVER_ERROR";
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    try {
      await logApiRequest({
        builderId: builderId || "unknown",
        licenseId,
        endpoint: "/api/v1/license/update",
        ipAddress,
        installationId: reqInstallationId,
        statusCode,
        errorType,
        responseTimeMs: Date.now() - startTime
      });
    } catch (e) {
      console.error("Failed to write audit log", e);
    }
  }
}

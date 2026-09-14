import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const contentType = req.headers.get("content-type") || "";
    let key, installationId, Relesename;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      key = body.key;
      installationId = body.installationId;
      Relesename = body.Relesename;
    } else {
      const formData = await req.formData();
      key = formData.get("key") as string;
      installationId = formData.get("installationId") as string;
      Relesename = formData.get("Relesename") as string;
    }

    if (!key) {
      return NextResponse.json({ success: false, message: "License key is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({
      where: { key },
      include: { product: true, installations: true }
    });

    if (!license) {
      return NextResponse.json({ success: false, message: "Invalid license key" }, { status: 404 });
    }

    if (license.status === "FROZEN" || license.status === "DISABLED") {
      return NextResponse.json({ success: false, message: `License is ${license.status.toLowerCase()}` }, { status: 403 });
    }

    if (license.expiresAt && new Date() > license.expiresAt) {
      return NextResponse.json({ success: false, message: "License has expired" }, { status: 403 });
    }

    if (installationId) {
      let statusCode = 403;
      let errorType = "";
      // Check machine binding
      const existingInstall = license.installations.find(i => i.installationId === installationId);
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
      let windowMs = 24 * 60 * 60 * 1000; // days
      if (license.rateLimitWindow === "hours") windowMs = 60 * 60 * 1000;
      
      const timeSinceReset = now.getTime() - license.rateLimitResetAt.getTime();
      
      if (timeSinceReset > windowMs) {
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

    let releaseUrl = `https://api.github.com/repos/${githubRepo}/releases/latest`;
    if (Relesename) {
      releaseUrl = `https://api.github.com/repos/${githubRepo}/releases/tags/${Relesename}`;
    }

    const releaseRes = await fetch(releaseUrl, { method: "GET", headers, cache: "no-store" });

    if (!releaseRes.ok) {
      return NextResponse.json({ success: false, message: "Release not found or accessible" }, { status: 404 });
    }

    const release = await releaseRes.json();
    let downloadUrl = release.zipball_url;
    let filename = `${githubRepo.split("/")[1]}-${release.tag_name}.zip`;
    
    // If there is an uploaded asset in the release, use it
    if (release.assets && release.assets.length > 0) {
      downloadUrl = release.assets[0].url;
      filename = release.assets[0].name;
      headers["Accept"] = "application/octet-stream"; // Important for downloading assets
    } else {
      // For zipballs, we don't need octet-stream accept header, just the standard one or none.
    }

    // Now fetch the actual file stream (this will follow the AWS S3 redirect github gives)
    const downloadRes = await fetch(downloadUrl, { method: "GET", headers });

    if (!downloadRes.ok) {
      return NextResponse.json({ success: false, message: "Failed to download the release file" }, { status: downloadRes.status });
    }

    // Stream the file back to the user
    const responseHeaders = new Headers(downloadRes.headers);
    responseHeaders.set("Content-Disposition", `attachment; filename="${filename}"`);
    // Ensure we don't pass back any github specific encoding headers that might mess up the response
    responseHeaders.delete("content-encoding");

    return new NextResponse(downloadRes.body, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

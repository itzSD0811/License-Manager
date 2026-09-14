import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, installationId } = body;

    if (!key) {
      return NextResponse.json({ success: false, message: "License key is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({
      where: { key },
      include: { product: true, builder: true, installations: true }
    });

    if (!license) {
      return NextResponse.json({ success: false, message: "Invalid license key" }, { status: 404 });
    }

    if (license.status === "FROZEN" || license.status === "DISABLED") {
      return NextResponse.json({ success: false, message: `License is ${license.status.toLowerCase()}` }, { status: 403 });
    }

    // Checking expiry
    if (license.expiresAt && new Date() > license.expiresAt) {
      return NextResponse.json({ success: false, message: "License has expired" }, { status: 403 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    if (installationId) {
      let statusCode = 403;
      let errorType = "";
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

    const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`, {
      method: "GET",
      headers,
      cache: "no-store"
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ success: false, message: "No releases found for this repository" }, { status: 404 });
      }
      return NextResponse.json({ success: false, message: "Failed to fetch update from Github" }, { status: response.status });
    }

    const release = await response.json();

    return NextResponse.json({
      success: true,
      latest_version: release.tag_name,
      name: release.name,
      notes: release.body,
      published_at: release.published_at,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

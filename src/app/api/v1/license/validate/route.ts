import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logApiRequest } from '@/lib/api-logger';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const startTime = Date.now();
  let statusCode = 200;
  let errorType = undefined;
  let licenseId = undefined;
  let builderId = undefined;

  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";

  try {
    const body = await request.json();
    const { key, installationId } = body;

    if (!key || !installationId) {
      statusCode = 400;
      errorType = "MISSING_PARAMS";
      return NextResponse.json({ success: false, error: "Missing key or installationId" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { key }, include: { installations: true } });

    if (!license) {
      statusCode = 404;
      errorType = "INVALID_KEY";
      return NextResponse.json({ success: false, error: "Invalid license key" }, { status: 404 });
    }

    licenseId = license.id;
    builderId = license.builderId;

    if (license.status === "Disabled" || license.status === "Deleted") {
      statusCode = 403;
      errorType = "LICENSE_DISABLED";
      return NextResponse.json({ success: false, error: `License is ${license.status}` }, { status: 403 });
    }
    
    if (license.status === "Not Activated") {
      statusCode = 403;
      errorType = "NOT_ACTIVATED";
      return NextResponse.json({ success: false, error: "License must be activated first" }, { status: 403 });
    }

    // Expiry Check
    if (license.expiresAt && license.expiresAt < new Date()) {
      statusCode = 403;
      errorType = "EXPIRED";
      return NextResponse.json({ success: false, error: "License is expired" }, { status: 403 });
    }

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

    // Rate Limiting Check
    if (license.rateLimit && license.rateLimitWindow) {
      const now = new Date();
      let windowMs = 24 * 60 * 60 * 1000; // days
      if (license.rateLimitWindow === "hours") windowMs = 60 * 60 * 1000;
      
      const timeSinceReset = now.getTime() - license.rateLimitResetAt.getTime();
      
      if (timeSinceReset > windowMs) {
        // Reset the window
        await prisma.license.update({ where: { id: license.id }, data: { rateLimitHits: 1, rateLimitResetAt: now } });
      } else {
        if (license.rateLimitHits >= license.rateLimit) {
          statusCode = 429;
          errorType = "RATE_LIMIT_EXCEEDED";
          return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
        } else {
          await prisma.license.update({ where: { id: license.id }, data: { rateLimitHits: { increment: 1 } } });
        }
      }
    }

    // Update last seen
    await prisma.licenseInstallation.update({
      where: { id: existingInstall.id },
      data: { lastSeenAt: new Date(), ipAddress }
    });

    return NextResponse.json({ 
      success: true, 
      message: "License is valid",
      expiresAt: license.expiresAt,
      isFrozen: license.isFrozen
    });

  } catch (err: any) {
    statusCode = 500;
    errorType = "SERVER_ERROR";
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    if (builderId) {
      await logApiRequest({
        builderId,
        licenseId,
        endpoint: "/api/v1/license/validate",
        ipAddress,
        statusCode,
        errorType,
        responseTimeMs: Date.now() - startTime
      });
    }
  }
}

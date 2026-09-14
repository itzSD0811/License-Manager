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
    const { key, installationId, os, appVersion } = body;

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

    // Check machine binding
    if (license.installations.length > 0) {
      const existingInstall = license.installations.find(i => i.installationId === installationId);
      if (!existingInstall) {
        statusCode = 403;
        errorType = "HOST_MISMATCH";
        return NextResponse.json({ success: false, error: "License is already bound to another machine" }, { status: 403 });
      }
    }

    // Create or update installation
    await prisma.licenseInstallation.upsert({
      where: {
        installationId_licenseId: {
          installationId,
          licenseId: license.id
        }
      },
      update: { lastSeenAt: new Date(), ipAddress, os, appVersion },
      create: { installationId, licenseId: license.id, ipAddress, os, appVersion }
    });

    let newExpiresAt = license.expiresAt;
    
    if (license.status === "Not Activated") {
      let dataToUpdate: any = { status: "Active" };
      
      if (license.startAtActivation && !license.expiresAt) {
        if (license.expireYears || license.expireMonths || license.expireDays) {
          const d = new Date();
          if (license.expireYears) d.setFullYear(d.getFullYear() + license.expireYears);
          if (license.expireMonths) d.setMonth(d.getMonth() + license.expireMonths);
          if (license.expireDays) d.setDate(d.getDate() + license.expireDays);
          dataToUpdate.expiresAt = d;
          newExpiresAt = d;
        }
      }

      await prisma.license.update({ where: { id: license.id }, data: dataToUpdate });
    }

    try {
      const { sendMail } = await import("@/lib/mailer");
      const builder = await prisma.builder.findUnique({ where: { id: builderId }, include: { settings: true } });
      const fullLicense = await prisma.license.findUnique({ where: { id: licenseId }, include: { customer: true, product: true } });
      if (builder && fullLicense) {
        await sendMail({
          to: builder.email,
          subject: `License Activated - ${fullLicense.product.name}`,
          html: `<p>Customer <strong>${fullLicense.customer.name}</strong> has activated a license on a new device.</p><p>IP Address: ${ipAddress}</p><p>Hardware ID: ${installationId}</p>`
        });
      }
    } catch (e) {
      console.error("Failed to send activation email", e);
    }

    return NextResponse.json({ 
      success: true, 
      message: "License activated successfully",
      expiresAt: newExpiresAt 
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
        endpoint: "/api/v1/license/activate",
        ipAddress,
        statusCode,
        errorType,
        responseTimeMs: Date.now() - startTime
      });
    }
  }
}

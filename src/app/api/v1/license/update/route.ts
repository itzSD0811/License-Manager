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
      include: { product: true, builder: true }
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

    if (installationId) {
      const isBound = await prisma.licenseInstallation.findFirst({
        where: { licenseId: license.id, installationId }
      });
      if (!isBound) {
        return NextResponse.json({ success: false, message: "Installation ID does not match or is missing" }, { status: 403 });
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

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, success } = await request.json();
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Log the attempt
    await prisma.loginAttempt.create({
      data: {
        email,
        ipAddress,
        device: userAgent.substring(0, 200),
        success,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

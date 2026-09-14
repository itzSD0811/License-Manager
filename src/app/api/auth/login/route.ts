import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MAX_ATTEMPTS = 3;
const COOLDOWN_MINUTES = 15;
const LOCKOUT_ATTEMPTS = 9; // 3 cycles of 3 attempts

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const now = new Date();
    const cooldownTime = new Date(now.getTime() - COOLDOWN_MINUTES * 60000);

    // Get recent failed attempts for this email/IP
    const recentFailedAttempts = await prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: {
          gte: cooldownTime,
        },
      },
    });

    // Check if permanently locked (e.g., too many cycles in last 24h)
    const dailyFailedAttempts = await prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60000),
        },
      },
    });

    if (dailyFailedAttempts >= LOCKOUT_ATTEMPTS) {
      return NextResponse.json(
        { error: "Account temporarily locked due to suspicious activity. Please try again tomorrow or contact support." },
        { status: 429 }
      );
    }

    if (recentFailedAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: `Too many failed attempts. Please wait ${COOLDOWN_MINUTES} minutes.` },
        { status: 429 }
      );
    }

    // If we passed the brute force check, we return success.
    // The actual Firebase password verification happens on the client, 
    // but the client MUST call this endpoint first to check rate limits.
    // Alternatively, we can verify the Firebase password here using Firebase REST API,
    // but returning OK allows the client to proceed with signInWithEmailAndPassword.

    return NextResponse.json({ success: true, allowed: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

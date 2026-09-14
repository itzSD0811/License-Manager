"use server";

import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { sendMail } from "@/lib/mailer";

const prisma = new PrismaClient();

async function getSessionLicense() {
  const cookieStore = await cookies();
  const session = cookieStore.get("customer_session")?.value;
  if (!session) return null;
  
  return prisma.license.findUnique({
    where: { id: session },
    include: {
      customer: true,
      builder: true,
      product: true
    }
  });
}

export async function requestRenewal(message: string) {
  try {
    const license = await getSessionLicense();
    if (!license) return { success: false, message: "Unauthorized" };

    const builderEmail = license.builder.email;

    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>License Renewal Request</h2>
        <p><strong>Customer:</strong> ${license.customer.name} (${license.customer.email})</p>
        <p><strong>Product:</strong> ${license.product.name}</p>
        <p><strong>License Key:</strong> ${license.key}</p>
        <div style="background: #f4f4f5; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 20px;">
          <strong>Message from customer:</strong><br><br>
          ${message || "No additional message provided."}
        </div>
      </div>
    `;

    await sendMail({
      to: builderEmail,
      subject: `Renewal Request - ${license.customer.name}`,
      html
    });

    await prisma.notification.create({
      data: {
        builderId: license.builder.id,
        title: "License Renewal Request",
        message: `${license.customer.name} / ${license.id} / ${license.product.name}\nMessage: ${message || "None"}`,
        link: "/builder/dashboard/licenses"
      }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function requestRateLimitReset(message: string) {
  try {
    const license = await getSessionLicense();
    if (!license) return { success: false, message: "Unauthorized" };

    const builderEmail = license.builder.email;

    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Rate Limit Reset Request</h2>
        <p><strong>Customer:</strong> ${license.customer.name} (${license.customer.email})</p>
        <p><strong>Product:</strong> ${license.product.name}</p>
        <p><strong>License Key:</strong> ${license.key}</p>
        <div style="background: #f4f4f5; padding: 15px; border-left: 4px solid #ef4444; margin-top: 20px;">
          <strong>Message from customer:</strong><br><br>
          ${message || "No additional message provided."}
        </div>
      </div>
    `;

    await sendMail({
      to: builderEmail,
      subject: `Rate Limit Reset Request - ${license.customer.name}`,
      html
    });

    await prisma.notification.create({
      data: {
        builderId: license.builder.id,
        title: "Rate Limit Reset Request",
        message: `${license.customer.name} / ${license.id} / ${license.product.name}\nMessage: ${message || "None"}`,
        link: "/builder/dashboard/licenses"
      }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

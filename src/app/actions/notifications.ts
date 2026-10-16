"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getNotifications(builderId: string) {
  return prisma.notification.findMany({
    where: { builderId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
}

export async function markNotificationsRead(builderId: string) {
  await prisma.notification.updateMany({
    where: { builderId, isRead: false },
    data: { isRead: true }
  });
}

export async function clearAllNotifications(builderId: string) {
  await prisma.notification.deleteMany({
    where: { builderId }
  });
  revalidatePath("/builder/dashboard");
}

export async function deleteNotification(id: string, builderId: string) {
  await prisma.notification.deleteMany({
    where: { id, builderId }
  });
  revalidatePath("/builder/dashboard");
}

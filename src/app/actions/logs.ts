"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function clearAllApiLogs() {
  await prisma.apiLog.deleteMany({});
  revalidatePath("/builder/dashboard/logs"); // Wait, path might need regex if dynamic, but it's revalidating the whole tree or just this path. Actually we can revalidatePath("/", "layout") to just refresh everything.
  revalidatePath("/", "layout");
}

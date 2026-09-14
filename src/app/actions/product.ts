"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { encryptString, decryptString } from "@/lib/encryption";

const prisma = new PrismaClient();

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const githubRepo = formData.get("githubRepo") as string;
  const githubToken = formData.get("githubToken") as string;
  const email = formData.get("builderEmail") as string;

  if (!name || !email) {
    throw new Error("Missing required fields");
  }

  // Get or create builder (in case they signed up via Firebase Console manually)
  const builder = await prisma.builder.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  await prisma.product.create({
    data: {
      name,
      githubRepo: githubRepo || null,
      githubToken: githubToken ? encryptString(githubToken) : null,
      builderId: builder.id,
    }
  });

  revalidatePath("/builder/dashboard/softwares");
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing product ID");

  await prisma.product.delete({
    where: { id }
  });

  revalidatePath("/builder/dashboard/softwares");
}

export async function updateProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const githubRepo = formData.get("githubRepo") as string;
  const githubToken = formData.get("githubToken") as string;

  if (!id || !name) throw new Error("Missing required fields");

  await prisma.product.update({
    where: { id },
    data: {
      name,
      githubRepo: githubRepo || null,
      githubToken: githubToken ? encryptString(githubToken) : null,
    }
  });

  revalidatePath("/builder/dashboard/softwares");
}

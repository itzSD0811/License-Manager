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
  
  const rsaAction = formData.get("rsaAction") as string; // 'generate', 'paste', or 'none'
  const pastedPrivateKey = formData.get("pastedPrivateKey") as string;

  if (!name || !email) {
    throw new Error("Missing required fields");
  }

  let rsaPrivateKey: string | null = null;
  let rsaPublicKey: string | null = null;

  if (rsaAction === "generate") {
    const { generateRSAKeypair } = await import("@/lib/rsa");
    const keys = generateRSAKeypair();
    rsaPrivateKey = encryptString(keys.privateKey);
    rsaPublicKey = keys.publicKey;
  } else if (rsaAction === "paste" && pastedPrivateKey) {
    const { derivePublicKey } = await import("@/lib/rsa");
    try {
      rsaPublicKey = derivePublicKey(pastedPrivateKey);
      rsaPrivateKey = encryptString(pastedPrivateKey);
    } catch (e) {
      throw new Error("Invalid Private Key provided");
    }
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
      rsaPrivateKey,
      rsaPublicKey,
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

  const rsaAction = formData.get("rsaAction") as string;
  const pastedPrivateKey = formData.get("pastedPrivateKey") as string;

  if (!id || !name) throw new Error("Missing required fields");

  const updateData: any = {
    name,
    githubRepo: githubRepo || null,
    githubToken: githubToken ? encryptString(githubToken) : null,
  };

  if (rsaAction === "generate") {
    const { generateRSAKeypair } = await import("@/lib/rsa");
    const keys = generateRSAKeypair();
    updateData.rsaPrivateKey = encryptString(keys.privateKey);
    updateData.rsaPublicKey = keys.publicKey;
  } else if (rsaAction === "paste" && pastedPrivateKey) {
    const { derivePublicKey } = await import("@/lib/rsa");
    try {
      updateData.rsaPublicKey = derivePublicKey(pastedPrivateKey);
      updateData.rsaPrivateKey = encryptString(pastedPrivateKey);
    } catch (e) {
      throw new Error("Invalid Private Key provided");
    }
  }

  await prisma.product.update({
    where: { id },
    data: updateData
  });

  revalidatePath("/builder/dashboard/softwares");
}

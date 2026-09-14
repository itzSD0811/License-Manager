"use server";

import { PrismaClient } from "@prisma/client";
import { decryptString } from "@/lib/encryption";

const prisma = new PrismaClient();

export async function getProductReleases(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.githubRepo) {
    return { releases: null, error: "No repository configured" };
  }

  const headers: any = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "LicenseManager-App"
  };

  if (product.githubToken) {
    headers["Authorization"] = `Bearer ${decryptString(product.githubToken)}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${product.githubRepo}/releases`, {
      headers,
      cache: "no-store", // Always fetch fresh realtime data
    });

    if (!res.ok) {
      if (res.status === 404) return { releases: null, error: "Repository not found or token missing/invalid." };
      if (res.status === 403) return { releases: null, error: "API rate limit exceeded or forbidden." };
      return { releases: null, error: `GitHub API Error: ${res.statusText}` };
    }

    const data = await res.json();
    
    // Simplify payload for the client
    const releases = data.map((r: any) => ({
      id: r.id.toString(),
      tag_name: r.tag_name,
      name: r.name,
      body: r.body || "No release notes provided.",
      published_at: r.published_at,
    }));

    return { releases, error: null };
  } catch (e: any) {
    return { releases: null, error: e.message };
  }
}

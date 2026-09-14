import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import StatusClientUI from "./ClientUI";

const prisma = new PrismaClient();

export default async function StatusPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("customer_session")?.value;

  if (!session) {
    redirect("/login");
  }

  const license = await prisma.license.findUnique({
    where: { id: session },
    include: {
      customer: true,
      product: true,
      installations: {
        orderBy: { lastSeenAt: 'desc' }
      }
    }
  });

  if (!license || license.isLocked) {
    redirect("/login");
  }

  // Parse strings and dates properly for client props
  const safeLicense = {
    ...license,
    createdAt: license.createdAt.toISOString(),
    updatedAt: license.updatedAt.toISOString(),
    expiresAt: license.expiresAt?.toISOString() || null,
    rateLimitResetAt: license.rateLimitResetAt.toISOString(),
    installations: license.installations.map(i => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      lastSeenAt: i.lastSeenAt.toISOString()
    }))
  };

  return <StatusClientUI license={safeLicense} />;
}

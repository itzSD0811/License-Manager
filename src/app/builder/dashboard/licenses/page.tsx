import { PrismaClient } from "@prisma/client";
import LicensesClientUI from "./ClientUI";

const prisma = new PrismaClient();

export default async function LicensesPage() {
  const licenses = await prisma.license.findMany({
    include: {
      product: true,
      customer: true,
      installations: true,
    },
    orderBy: { createdAt: "desc" }
  });

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <LicensesClientUI licenses={licenses} products={products} />
  );
}

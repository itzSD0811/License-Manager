import { PrismaClient } from "@prisma/client";
import SoftwaresClientUI from "./ClientUI";

const prisma = new PrismaClient();

export default async function SoftwaresPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return <SoftwaresClientUI products={products} />;
}

import { PrismaClient } from "@prisma/client";
import SimulatorClientUI from "./ClientUI";

const prisma = new PrismaClient();

export default async function SimulatorPage() {
  const licenses = await prisma.license.findMany({
    select: { key: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <SimulatorClientUI licenses={licenses} />
  );
}

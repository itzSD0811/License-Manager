import { PrismaClient } from "@prisma/client";
import ApiLogsClientUI from "./ClientUI";

const prisma = new PrismaClient();

export default async function ApiLogsPage() {
  const logs = await prisma.apiLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000 // Get latest 1000 logs for client-side processing
  });

  return (
    <ApiLogsClientUI initialLogs={logs} />
  );
}

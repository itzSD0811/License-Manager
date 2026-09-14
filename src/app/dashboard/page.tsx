import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import DashboardClientUI from "./ClientUI";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("customer_session")?.value;

  if (!session) redirect("/login");

  const license = await prisma.license.findUnique({
    where: { id: session },
    include: {
      product: true,
      apiLogs: {
        orderBy: { createdAt: "desc" },
        take: 100 // We'll analyze the last 100 requests for performance, or fetch them all if needed
      }
    }
  });

  if (!license) redirect("/login");

  // Calculate Stats
  const totalRequests = license.apiLogs.length;
  const successRequests = license.apiLogs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
  const failedRequests = totalRequests - successRequests;
  const successRate = totalRequests > 0 ? Math.round((successRequests / totalRequests) * 100) : 0;
  
  const unauthorizedRequests = license.apiLogs.filter(l => l.statusCode === 403);

  return (
    <DashboardClientUI 
      license={license}
      stats={{ totalRequests, successRequests, failedRequests, successRate, unauthorizedRequests }}
    />
  );
}

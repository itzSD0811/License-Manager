import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import UsageClientUI from "./ClientUI";

const prisma = new PrismaClient();

export default async function UsagePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("customer_session")?.value;

  if (!session) redirect("/login");

  const license = await prisma.license.findUnique({
    where: { id: session },
    include: { product: true }
  });

  if (!license) redirect("/login");

  return <UsageClientUI license={license} />;
}

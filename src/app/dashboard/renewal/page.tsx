import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import RenewalClientUI from "./ClientUI";

const prisma = new PrismaClient();

export default async function RenewalPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("customer_session")?.value;

  if (!session) redirect("/login");

  const license = await prisma.license.findUnique({
    where: { id: session },
    include: { product: true }
  });

  if (!license) redirect("/login");

  return <RenewalClientUI license={license} />;
}

export const dynamic = "force-dynamic";
import { PrismaClient } from "@prisma/client";
import SettingsClientUI from "./ClientUI";

const prisma = new PrismaClient();

export default async function SettingsPage() {
  let builder = await prisma.builder.findFirst({
    include: { settings: true }
  });

  if (!builder) {
    builder = await prisma.builder.create({
      data: {
        email: "admin@magneticx.com",
        settings: { create: {} }
      },
      include: { settings: true }
    });
  } else if (!builder.settings) {
    builder = await prisma.builder.update({
      where: { id: builder.id },
      data: { settings: { create: {} } },
      include: { settings: true }
    });
  }

  const loginAttempts = await prisma.loginAttempt.findMany({
    where: { email: builder.email },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return (
    <SettingsClientUI builder={builder} loginAttempts={loginAttempts} />
  );
}


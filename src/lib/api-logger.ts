import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function logApiRequest(params: {
  builderId: string;
  licenseId?: string;
  endpoint: string;
  ipAddress?: string;
  installationId?: string;
  statusCode: number;
  errorType?: string;
  responseTimeMs: number;
}) {
  try {
    await prisma.apiLog.create({
      data: {
        builderId: params.builderId,
        licenseId: params.licenseId,
        endpoint: params.endpoint,
        ipAddress: params.ipAddress,
        installationId: params.installationId,
        statusCode: params.statusCode,
        errorType: params.errorType,
        responseTimeMs: params.responseTimeMs
      }
    });
  } catch (err) {
    console.error("Failed to log API request:", err);
  }
}

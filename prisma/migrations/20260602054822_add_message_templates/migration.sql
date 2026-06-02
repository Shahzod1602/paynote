-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('REMINDER', 'OVERDUE', 'PAYMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL DEFAULT 'REMINDER',
    "name" TEXT NOT NULL,
    "bodyUz" TEXT NOT NULL,
    "bodyRu" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "requiresDebt" BOOLEAN NOT NULL DEFAULT true,
    "requiresDay" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "TemplateStatus" NOT NULL DEFAULT 'PENDING',
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

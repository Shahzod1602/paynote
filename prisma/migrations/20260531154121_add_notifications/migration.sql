-- CreateEnum
CREATE TYPE "NotifyChannel" AS ENUM ('SMS', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'FAILED', 'MOCK');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "telegramChatId" TEXT;

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "channel" "NotifyChannel" NOT NULL,
    "status" "MessageStatus" NOT NULL,
    "recipient" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "error" TEXT,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "debtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

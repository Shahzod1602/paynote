-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "smsUserEmail" TEXT,
ADD COLUMN     "smsPassword" TEXT,
ADD COLUMN     "smsApiKey" TEXT,
ADD COLUMN     "smsVia" TEXT NOT NULL DEFAULT 'gateway';

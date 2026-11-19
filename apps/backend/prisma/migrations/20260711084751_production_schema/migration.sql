/*
  Warnings:

  - You are about to drop the column `title` on the `Competency` table. All the data in the column will be lost.
  - Added the required column `name` to the `Competency` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('VALID', 'EXPIRED', 'EXPIRING');

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "Competency" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'VALID',
    "certificateNo" TEXT,
    "fileUrl" TEXT,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Certificate_staffId_idx" ON "Certificate"("staffId");

-- CreateIndex
CREATE INDEX "Certificate_expiryDate_idx" ON "Certificate"("expiryDate");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Competency_staffId_idx" ON "Competency"("staffId");

-- CreateIndex
CREATE INDEX "Staff_employeeNo_idx" ON "Staff"("employeeNo");

-- CreateIndex
CREATE INDEX "Staff_lastName_idx" ON "Staff"("lastName");

-- CreateIndex
CREATE INDEX "Training_staffId_idx" ON "Training"("staffId");

-- CreateIndex
CREATE INDEX "Training_expiresOn_idx" ON "Training"("expiresOn");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

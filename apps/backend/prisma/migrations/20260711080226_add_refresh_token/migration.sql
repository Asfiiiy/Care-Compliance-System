/*
  Warnings:

  - You are about to drop the column `assessedOn` on the `Competency` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Competency` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Certificate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `achievedOn` to the `Competency` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_staffId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_staffId_fkey";

-- AlterTable
ALTER TABLE "Competency" DROP COLUMN "assessedOn",
DROP COLUMN "notes",
ADD COLUMN     "achievedOn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "expiresOn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshTokenHash" TEXT;

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Certificate";

-- DropTable
DROP TABLE "Notification";

-- DropEnum
DROP TYPE "NotificationStatus";

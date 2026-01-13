/*
  Warnings:

  - You are about to alter the column `stare` on the `evenimente` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to drop the `prezente` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `prezente` DROP FOREIGN KEY `prezente_evenimentId_fkey`;

-- DropForeignKey
ALTER TABLE `prezente` DROP FOREIGN KEY `prezente_participantId_fkey`;

-- AlterTable
ALTER TABLE `evenimente` ADD COLUMN `end` DATETIME(3) NULL,
    MODIFY `stare` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'CLOSED';

-- DropTable
DROP TABLE `prezente`;

-- CreateTable
CREATE TABLE `Prezenta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `moment` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `participantId` INTEGER NOT NULL,
    `evenimentId` INTEGER NOT NULL,

    UNIQUE INDEX `Prezenta_participantId_evenimentId_key`(`participantId`, `evenimentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Prezenta` ADD CONSTRAINT `Prezenta_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `participanti`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prezenta` ADD CONSTRAINT `Prezenta_evenimentId_fkey` FOREIGN KEY (`evenimentId`) REFERENCES `evenimente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

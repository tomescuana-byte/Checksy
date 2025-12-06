-- CreateTable
CREATE TABLE `organizatori` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nume` VARCHAR(191) NOT NULL,
    `prenume` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `parola` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `organizatori_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupuri_evenimente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nume` VARCHAR(191) NOT NULL,
    `organizatorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evenimente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titlu` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `stare` VARCHAR(191) NOT NULL DEFAULT 'INCHIS',
    `codAcces` VARCHAR(191) NOT NULL,
    `grupEvenimenteId` INTEGER NOT NULL,

    UNIQUE INDEX `evenimente_codAcces_key`(`codAcces`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participanti` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nume` VARCHAR(191) NOT NULL,
    `prenume` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prezente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `moment` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `evenimentId` INTEGER NOT NULL,
    `participantId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `grupuri_evenimente` ADD CONSTRAINT `grupuri_evenimente_organizatorId_fkey` FOREIGN KEY (`organizatorId`) REFERENCES `organizatori`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evenimente` ADD CONSTRAINT `evenimente_grupEvenimenteId_fkey` FOREIGN KEY (`grupEvenimenteId`) REFERENCES `grupuri_evenimente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prezente` ADD CONSTRAINT `prezente_evenimentId_fkey` FOREIGN KEY (`evenimentId`) REFERENCES `evenimente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prezente` ADD CONSTRAINT `prezente_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `participanti`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('AGUARDANDO', 'CONFIRMADO', 'RECUSADO');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "desiredQty" INTEGER NOT NULL DEFAULT 1,
    "giftedQty" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Confirmation" (
    "id" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestWhatsapp" TEXT,
    "message" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "ConfirmationStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Confirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "confirmationId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "coupleNames" TEXT NOT NULL DEFAULT 'Maria Mercedez e Henrique',
    "groomName" TEXT,
    "brideName" TEXT,
    "coupleStory" TEXT,
    "welcomeMsg" TEXT NOT NULL DEFAULT 'Ficamos muito felizes em compartilhar este momento com você.',
    "guestMessage" TEXT,
    "photoUrl" TEXT,
    "bannerUrl" TEXT,
    "logoUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "eventTime" TEXT,
    "venueName" TEXT,
    "address" TEXT,
    "mapsUrl" TEXT,
    "notifyEmail" TEXT,
    "themeName" TEXT NOT NULL DEFAULT 'classico',
    "primaryColor" TEXT NOT NULL DEFAULT '#6E2A3A',
    "secondaryColor" TEXT NOT NULL DEFAULT '#B8945F',
    "fontFamily" TEXT NOT NULL DEFAULT 'Cormorant Garamond',
    "buttonStyle" TEXT NOT NULL DEFAULT 'pill',
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "pixKey" TEXT NOT NULL DEFAULT '',
    "pixKeyType" TEXT NOT NULL DEFAULT 'email',
    "pixCity" TEXT NOT NULL DEFAULT 'BRASILIA',
    "defaultAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "smtpFrom" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Gift_categoryId_idx" ON "Gift"("categoryId");
CREATE INDEX "Confirmation_giftId_idx" ON "Confirmation"("giftId");
CREATE INDEX "Confirmation_status_idx" ON "Confirmation"("status");
CREATE UNIQUE INDEX "Receipt_confirmationId_key" ON "Receipt"("confirmationId");

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_confirmationId_fkey" FOREIGN KEY ("confirmationId") REFERENCES "Confirmation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "rating" DOUBLE PRECISION,
    "ratingCount" INTEGER,
    "category" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "hasWebsite" BOOLEAN NOT NULL DEFAULT false,
    "websiteSpeed" INTEGER,
    "websiteStatus" TEXT,
    "leadScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_history" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "results" INTEGER NOT NULL,
    "leads" INTEGER NOT NULL,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_placeId_key" ON "leads"("placeId");

-- CreateIndex
CREATE INDEX "leads_city_category_idx" ON "leads"("city", "category");

-- CreateIndex
CREATE INDEX "leads_hasWebsite_idx" ON "leads"("hasWebsite");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

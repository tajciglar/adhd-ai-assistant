/*
  Warnings:

  - The primary key for the `report_templates` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "report_templates" DROP CONSTRAINT "report_templates_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ADD CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Downloadable Resources',
    "knowledge_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resources_storage_path_key" ON "resources"("storage_path");

-- CreateIndex
CREATE UNIQUE INDEX "resources_knowledge_entry_id_key" ON "resources"("knowledge_entry_id");

-- CreateIndex
CREATE INDEX "resources_category_idx" ON "resources"("category");

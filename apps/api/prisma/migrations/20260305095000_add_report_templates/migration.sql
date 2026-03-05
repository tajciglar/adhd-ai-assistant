CREATE TABLE "report_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "archetype_id" TEXT NOT NULL,
  "template" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "report_templates_archetype_id_key" ON "report_templates" ("archetype_id");

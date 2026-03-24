-- CreateTable
CREATE TABLE "message_feedbacks" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_feedbacks_message_id_idx" ON "message_feedbacks"("message_id");

-- CreateIndex
CREATE INDEX "message_feedbacks_user_id_idx" ON "message_feedbacks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_feedbacks_message_id_user_id_key" ON "message_feedbacks"("message_id", "user_id");

-- AddForeignKey
ALTER TABLE "message_feedbacks" ADD CONSTRAINT "message_feedbacks_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "knowledge_chunks_embedding_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "has_chat_access" BOOLEAN NOT NULL DEFAULT false;

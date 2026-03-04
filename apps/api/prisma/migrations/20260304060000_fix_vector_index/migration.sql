-- DropIndex: IVFFlat with lists=100 on <100 rows causes random query misses
DROP INDEX IF EXISTS "knowledge_chunks_embedding_idx";

-- RecreateIndex: HNSW works correctly at any dataset size
CREATE INDEX "knowledge_chunks_embedding_idx"
ON "knowledge_chunks"
USING hnsw ("embedding" vector_cosine_ops);

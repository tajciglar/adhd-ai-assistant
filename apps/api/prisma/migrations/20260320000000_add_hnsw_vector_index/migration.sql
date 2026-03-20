-- Add HNSW index on knowledge_chunks.embedding for fast cosine similarity search.
-- Without this index, every vector query does a full table scan.
-- HNSW provides ~98% recall with much faster query times than sequential scan.
CREATE INDEX CONCURRENTLY IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx
  ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

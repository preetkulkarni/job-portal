"""
FAISS Vector Service for semantic search and similarity scoring.

Handles persistent storage of embeddings and maps FAISS integer IDs 
to database UUIDs. Optimized for cosine similarity to provide match percentages.
"""
import logging
import os
import pickle
from uuid import UUID

import faiss
import numpy as np

logger = logging.getLogger(__name__)

class FAISSService:
    def __init__(self, dimension: int = 384, storage_dir: str = "./data"):
        """
        Initialize the FAISS index with Inner Product (Cosine Similarity support).
        """
        self.dimension = dimension
        self.storage_dir = storage_dir
        
        os.makedirs(self.storage_dir, exist_ok=True)
        self.index_path = os.path.join(self.storage_dir, "resume_index.faiss")
        self.mapping_path = os.path.join(self.storage_dir, "resume_mapping.pkl")

        self.id_to_uuid: dict[int, UUID] = {}
        self.uuid_to_id: dict[UUID, int] = {}
        self.current_id = 0

        self._load_index()

    def _load_index(self):
        """Loads index and mappings from disk or initializes a fresh state."""
        if os.path.exists(self.index_path) and os.path.exists(self.mapping_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.mapping_path, "rb") as f:
                    mappings = pickle.load(f)
                    self.id_to_uuid = mappings.get("id_to_uuid", {})
                    self.uuid_to_id = mappings.get("uuid_to_id", {})
                
                if self.id_to_uuid:
                    self.current_id = max(self.id_to_uuid.keys()) + 1
                
                logger.info(f"FAISS Loaded: {self.index.ntotal} vectors restored.")
            except Exception as e:
                logger.error(f"Failed to load FAISS index: {e}. Starting fresh.")
                self._initialize_empty_index()
        else:
            self._initialize_empty_index()

    def _initialize_empty_index(self):
        """Creates a brand new index optimized for Cosine Similarity."""
        # IndexFlatIP uses Inner Product, which is equivalent to Cosine Similarity 
        # when vectors are normalized.
        self.index = faiss.IndexFlatIP(self.dimension)
        self.id_to_uuid = {}
        self.uuid_to_id = {}
        self.current_id = 0

    def _save_index(self):
        """Persists index and ID mappings to disk."""
        try:
            faiss.write_index(self.index, self.index_path)
            with open(self.mapping_path, "wb") as f:
                pickle.dump({
                    "id_to_uuid": self.id_to_uuid,
                    "uuid_to_id": self.uuid_to_id
                }, f)
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")

    def add_vector(self, item_uuid: UUID, vector: list[float]):
        """
        Adds a vector to the index. Normalizes it for Cosine Similarity.
        """
        # Convert to numpy and normalize for Inner Product search (Cosine Similarity)
        np_vector = np.array([vector], dtype=np.float32)
        faiss.normalize_L2(np_vector)
        
        self.id_to_uuid[self.current_id] = item_uuid
        self.uuid_to_id[item_uuid] = self.current_id
        
        self.index.add(np_vector)
        self.current_id += 1
        self._save_index()

    def calculate_match_score(self, vec_a: list[float], vec_b: list[float]) -> float:
        """
        Calculates a direct match percentage between two vectors.
        Returns a float between 0.0 and 1.0.
        """
        a = np.array([vec_a], dtype=np.float32)
        b = np.array([vec_b], dtype=np.float32)
        
        faiss.normalize_L2(a)
        faiss.normalize_L2(b)
        
        # Inner product of normalized vectors = Cosine Similarity
        similarity = np.dot(a, b.T)[0][0]
        
        # Clip to ensure it stays in 0-1 range (prevents precision float errors)
        return float(max(0.0, min(1.0, similarity)))

    def search(self, query_vector: list[float], top_k: int = 10) -> list[dict]:
        """
        Searches for top matches and returns normalized match scores.
        """
        if self.index.ntotal == 0:
            return []

        np_query = np.array([query_vector], dtype=np.float32)
        faiss.normalize_L2(np_query)
        
        # distances here will be the similarity scores (Inner Product)
        scores, indices = self.index.search(np_query, top_k)
        
        results = []
        for i in range(len(indices[0])):
            faiss_id = indices[0][i]
            score = scores[0][i]
            
            if faiss_id == -1:
                continue
                
            db_uuid = self.id_to_uuid.get(faiss_id)
            if db_uuid:
                results.append({
                    "uuid": db_uuid,
                    "match_score": float(max(0.0, min(1.0, score)))
                })
                
        return results

# Singleton instance
resume_index = FAISSService()
job_index = FAISSService()
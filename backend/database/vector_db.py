import faiss
import numpy as np
import json
import os
from sentence_transformers import SentenceTransformer

class VectorMemory:
    def __init__(self, index_path="database/faiss_index.bin", metadata_path="database/metadata.json"):
        self.index_path = index_path
        self.metadata_path = metadata_path
        self.dimension = 384  # For all-MiniLM-L6-v2
        
        # Load the sentence transformer model
        # Using a small, fast model for embeddings
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize or load FAISS index
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            
        # Initialize or load metadata
        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, 'r') as f:
                self.metadata = json.load(f)
        else:
            self.metadata = []

    def add_memory(self, query: str, response: str, context: dict = None):
        """Add a query and its response to memory"""
        text_to_embed = f"Query: {query} \nResponse: {response}"
        embedding = self.model.encode([text_to_embed])[0]
        
        # Ensure it's 2D array of float32
        embedding = np.array([embedding]).astype('float32')
        
        self.index.add(embedding)
        
        self.metadata.append({
            "id": len(self.metadata),
            "query": query,
            "response": response,
            "context": context
        })
        
        self.save()

    def search_memory(self, query: str, k: int = 3):
        """Search memory for similar previous queries"""
        if self.index.ntotal == 0:
            return []
            
        embedding = self.model.encode([query])[0]
        embedding = np.array([embedding]).astype('float32')
        
        distances, indices = self.index.search(embedding, min(k, self.index.ntotal))
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1:
                results.append({
                    "distance": float(distances[0][i]),
                    "data": self.metadata[idx]
                })
                
        return results

    def save(self):
        """Save index and metadata"""
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, 'w') as f:
            json.dump(self.metadata, f)

# Global instance
memory_db = None

def get_memory_db():
    global memory_db
    if memory_db is None:
        memory_db = VectorMemory()
    return memory_db

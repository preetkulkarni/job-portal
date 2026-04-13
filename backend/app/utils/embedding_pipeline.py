"""
Text embedding pipeline using HuggingFace SentenceTransformers.
"""
from sentence_transformers import SentenceTransformer

# Load model at the module level for performance.
# all-MiniLM-L6-v2 generates 384-dimensional dense vectors.
model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embedding(text: str) -> list[float]:
    """
    Convert a string of text into a high-dimensional vector array.
    
    Args:
        text: The raw text (e.g., job description or resume text).
        
    Returns:
        A list of floats representing the semantic embedding.
    """
    cleaned_text = text.replace('\n', ' ').strip()
    
    # convert_to_numpy=True creates the dense array needed for FAISS math
    embedding = model.encode(cleaned_text, convert_to_numpy=True)
    
    return embedding.tolist()
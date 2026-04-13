"""
Utilities for PDF text extraction and text normalization.

Handles memory-resident PDF processing and regex-based cleaning to prepare 
resumes for LLM parsing and vector embedding.
"""
import logging
import re
from typing import Final

import fitz  # PyMuPDF

# Initialize logger for production tracking
logger = logging.getLogger(__name__)

# Pre-compile regex patterns for performance
UNICODE_CLEANER: Final = re.compile(r'[\u200b\u200c\u200d\uFEFF]')
HYPHEN_ARTIFACTS: Final = re.compile(r'(\w+)-\n(\w+)')
SPACING_NORMALIZER: Final = re.compile(r'[ \t]+')
NEWLINE_NORMALIZER: Final = re.compile(r'\n{3,}')
# Standardizing common bullet points
BULLET_PATTERN: Final = re.compile(r'[•·▪○✸❖➢]')

def clean_resume_text(raw_text: str) -> str:
    """
    Normalizes raw text extracted from resumes for better LLM context.
    
    Args:
        raw_text: The string extracted directly from a document parser.
        
    Returns:
        A cleaned, normalized string.
    """
    if not raw_text:
        return ""
    
    # 1. Remove invisible formatting characters
    text = UNICODE_CLEANER.sub('', raw_text)
    
    # 2. Fix PDF hyphenation artifacts
    text = HYPHEN_ARTIFACTS.sub(r'\1\2', text)
    
    # 3. Standardize bullet points to hyphens
    text = BULLET_PATTERN.sub('-', text)
    
    # 4. Normalize spacing
    text = SPACING_NORMALIZER.sub(' ', text)
    text = NEWLINE_NORMALIZER.sub('\n\n', text)
    
    # NOTE: I removed the strict ASCII encoding. 
    # Modern LLMs (Gemini/GPT) handle Unicode perfectly. 
    # Wiping non-ASCII can break names like "André" or "Müller".

    return text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a PDF byte stream.
    
    Args:
        file_bytes: The raw content of an uploaded PDF file.
        
    Returns:
        Extracted text content or an empty string if extraction fails.
    """
    if not file_bytes:
        return ""

    extracted_pages = []
    
    try:
        # Using context manager for automatic resource cleanup
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            # Check for encrypted files (security best practice)
            if doc.is_encrypted:
                logger.warning("Attempted to parse an encrypted PDF.")
                return ""

            for page in doc:
                # "blocks" mode is often better for preserving logical flow
                # but "text" is usually sufficient for LLM context.
                extracted_pages.append(page.get_text("text"))
                
        return "\n".join(extracted_pages)
        
    except Exception as e:
        logger.error(f"Failed to parse PDF from memory: {e}", exc_info=True)
        return ""
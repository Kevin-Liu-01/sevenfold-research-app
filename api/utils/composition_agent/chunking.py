"""
Utilities for chunking compositions and papers for semantic search.
"""

import hashlib
from typing import List, Tuple
from db.supabase import supabase
import torch
from transformers import AutoTokenizer, AutoModel

# Initialize embedding model (GTE-base)
tokenizer = AutoTokenizer.from_pretrained("thenlper/gte-base")
embed_model = AutoModel.from_pretrained("thenlper/gte-base")
embed_model.eval()


def compute_content_hash(content: str) -> str:
    """Compute SHA-256 hash of content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def embed_text(text: str) -> List[float]:
    """Generate embedding for text using GTE-base."""
    print(f"[embed_text] Input text length: {len(text)} chars")
    with torch.no_grad():
        inputs = tokenizer(
            text,
            padding=True,
            truncation=True,
            return_tensors="pt",
            max_length=512,
        )
        print(f"[embed_text] Tokenized input shape: {inputs['input_ids'].shape}")
        outputs = embed_model(**inputs)
        # Use mean pooling over token embeddings
        embeddings = outputs.last_hidden_state.mean(dim=1)
        print(f"[embed_text] Embeddings shape before norm: {embeddings.shape}")
        # Normalize
        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
        result = embeddings.squeeze(0).tolist()
        print(f"[embed_text] Final embedding dimension: {len(result)}")
        return result


def chunk_by_paragraphs(text: str, max_chunk_size: int = 1000, overlap_lines: int = 3) -> List[Tuple[str, int, int]]:
    """
    Chunk text by paragraphs, combining them until reaching max_chunk_size.
    Chunks overlap by a few lines for better context.
    
    Args:
        text: Text to chunk
        max_chunk_size: Maximum characters per chunk
        overlap_lines: Number of lines to overlap between chunks
    
    Returns:
        List of (chunk_text, start_line, end_line) tuples
    """
    if not text or not text.strip():
        return []
    
    lines = text.split('\n')
    chunks = []
    current_chunk_lines = []
    current_chunk_start = 0
    current_size = 0
    overlap_buffer = []  # Keep last N lines for overlap
    
    for i, line in enumerate(lines):
        line_size = len(line)
        
        # If this is an empty line and we have content, consider it a paragraph break
        if not line.strip() and current_chunk_lines:
            # If adding this line would exceed max size, save current chunk
            if current_size > max_chunk_size:
                chunk_text = '\n'.join(current_chunk_lines)
                chunks.append((chunk_text, current_chunk_start, i - 1))
                
                # Keep last overlap_lines for next chunk
                overlap_buffer = current_chunk_lines[-overlap_lines:] if len(current_chunk_lines) > overlap_lines else current_chunk_lines.copy()
                
                # Start new chunk with overlap
                current_chunk_lines = overlap_buffer.copy()
                current_chunk_start = i - len(overlap_buffer)
                current_size = sum(len(l) for l in current_chunk_lines)
                continue
        
        current_chunk_lines.append(line)
        current_size += line_size
    
    # Add final chunk
    if current_chunk_lines:
        chunk_text = '\n'.join(current_chunk_lines)
        chunks.append((chunk_text, current_chunk_start, len(lines) - 1))
    
    return chunks


def update_composition_chunks(project_id: str) -> dict:
    """
    Update chunks for all compositions in a project.
    Compares content hashes and only re-chunks compositions that have changed.
    
    Args:
        project_id: The project ID to update chunks for
        
    Returns:
        Dict with statistics about the update operation
    """
    print(f"\n=== UPDATE COMPOSITION CHUNKS ===")
    print(f"Project ID: {project_id}")
    
    # Get all compositions in the project
    compositions_resp = (
        supabase
        .table("compositions")
        .select("id, contents, project_id")
        .eq("project_id", project_id)
        .execute()
    )
    
    print(f"Found {len(compositions_resp.data) if compositions_resp.data else 0} compositions")
    
    if not compositions_resp.data:
        print("No compositions found")
        print("=== UPDATE COMPLETE ===\n")
        return {
            "total_compositions": 0,
            "updated": 0,
            "skipped": 0,
            "chunks_created": 0
        }
    
    compositions = compositions_resp.data
    updated_count = 0
    skipped_count = 0
    total_chunks_created = 0
    
    for comp in compositions:
        composition_id = comp["id"]
        comp_project_id = comp["project_id"]
        contents = comp.get("contents", "")
        
        print(f"\nProcessing composition: {composition_id}")
        
        # Skip if no content
        if not contents or not contents.strip():
            print("  -> Skipped (no content)")
            skipped_count += 1
            continue
        
        # Compute hash of current content
        current_hash = compute_content_hash(contents)
        print(f"  Current hash: {current_hash[:16]}...")
        
        # Check if chunks exist and if hash matches
        existing_chunks_resp = (
            supabase
            .table("composition_chunks")
            .select("content_hash")
            .eq("composition_id", composition_id)
            .limit(1)
            .execute()
        )
        
        needs_update = False
        if not existing_chunks_resp.data:
            # No chunks exist
            print("  -> No existing chunks")
            needs_update = True
        else:
            # Check if hash matches
            existing_hash = existing_chunks_resp.data[0].get("content_hash")
            print(f"  Existing hash: {existing_hash[:16] if existing_hash else 'None'}...")
            if existing_hash != current_hash:
                print("  -> Hash mismatch, needs update")
                needs_update = True
            else:
                print("  -> Hash matches, skipping")
        
        if not needs_update:
            skipped_count += 1
            continue
        
        # Delete existing chunks for this composition
        print("  Deleting old chunks...")
        supabase.table("composition_chunks").delete().eq("composition_id", composition_id).execute()
        
        # Create new chunks
        print("  Creating new chunks...")
        chunks = chunk_by_paragraphs(contents)
        print(f"  Generated {len(chunks)} raw chunks")
        
        if not chunks:
            skipped_count += 1
            continue
        
        # Generate embeddings and prepare for insert
        chunks_to_insert = []
        for i, (chunk_text, start_line, end_line) in enumerate(chunks):
            # Skip very short chunks
            if len(chunk_text.strip()) < 50:
                print(f"    Chunk {i+1}: Skipped (too short)")
                continue
            
            print(f"    Chunk {i+1}: Lines {start_line}-{end_line}, {len(chunk_text)} chars")
            embedding = embed_text(chunk_text)
            
            chunks_to_insert.append({
                "composition_id": composition_id,
                "project_id": comp_project_id,
                "content_hash": current_hash,
                "chunk_text": chunk_text,
                "start_line": start_line,
                "end_line": end_line,
                "embedding": embedding
            })
        
        if chunks_to_insert:
            print(f"  Inserting {len(chunks_to_insert)} chunks into database...")
            supabase.table("composition_chunks").insert(chunks_to_insert).execute()
            updated_count += 1
            total_chunks_created += len(chunks_to_insert)
            print(f"  -> Success!")
    
    result = {
        "total_compositions": len(compositions),
        "updated": updated_count,
        "skipped": skipped_count,
        "chunks_created": total_chunks_created
    }
    
    print(f"\n=== UPDATE COMPLETE ===")
    print(f"Total: {result['total_compositions']}, Updated: {result['updated']}, Skipped: {result['skipped']}, Chunks created: {result['chunks_created']}")
    print()
    
    return result

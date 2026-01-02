"""
Constants for the indexer module.
"""

from pathlib import Path

"""
Embedder constants
"""
EMBEDDER_EMBEDDING_DIM = 768
EMBEDDER_BATCH_SIZE = 256
EMBEDDER_BASE_MODEL_NAME = 'allenai/specter2_base'
EMBEDDER_MODEL_NAME = 'allenai/specter2'


"""
Preprocessor constants
"""
PREPROCESSOR_TEI_NS = {"tei": "http://www.tei-c.org/ns/1.0"}
PREPROCESSOR_HASH_BITS = 64
PREPROCESSOR_NUM_CONCURRENT = 16
PREPROCESSOR_TEI_FILE_SUFFIX = ".tei.xml"
PREPROCESSOR_LLM_MODEL = "claude-3-haiku-20240307"
PREPROCESSOR_LLM_MAX_TOKENS = 1024
PREPROCESSOR_LLM_TEMPERATURE = 0

"""
API keys and urls
"""
API_ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY"
API_SUPABASE_URL_ENV = "SUPABASE_URL"
API_SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY"
API_SUPABASE_ANON_KEY_ENV = "SUPABASE_ANON_KEY"

"""
Paths
"""
# Default to indexer/grobid_config.json, resolved relative to this file.
_REPO_ROOT = Path(__file__).resolve().parent.parent
GROBID_CONFIG_PATH = str((_REPO_ROOT / "core" / "grobid_config.json").resolve())

"""
Uploader constants
"""
UPLOADER_INSERT_BATCH_SIZE = 1000
UPLOADER_MAX_ATTEMPTS = 3

"""
Table names
"""
PAPER_ATTR_TABLE_NAME = "paper_attrs"
PUBLIC_CORPUS_TABLE_NAME = "publ_corpus"
UPLOADER_STORAGE_BUCKET = "library"

if __name__ == "__main__":
    import sys
    sys.exit("This module is not intended for direct execution. It provides constant values for other parts of the application.")

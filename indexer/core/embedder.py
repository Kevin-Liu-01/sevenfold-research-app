"""
Embedder: Generate SPECTER2 embeddings for processed JSON paper records.

Refactored for dependency injection (DI): model/tokenizer can be injected or
constructed via local factory functions. The active adapter alias (default:
"proximity") is configurable via the constructor.
"""

import logging
from typing import List, Optional

from tqdm import tqdm

from adapters import AutoAdapterModel
from .config import (
    EMBEDDER_BASE_MODEL_NAME,
    EMBEDDER_BATCH_SIZE,
    EMBEDDER_EMBEDDING_DIM,
    EMBEDDER_MODEL_NAME,
)
import numpy as np
import torch
from transformers.models.auto.tokenization_auto import AutoTokenizer

logger = logging.getLogger(__name__)

def create_adapter_model(
    base_model_name: str,
    adapter_model_name: str,
    device: torch.device,
    adapter_alias: str = "proximity",
    adapter_source: str = "hf",
):
    """Factory: create a base model and attach an adapter, returning a ready model."""
    model = AutoAdapterModel.from_pretrained(base_model_name)
    model.load_adapter(adapter_model_name, source=adapter_source, load_as=adapter_alias)
    model.set_active_adapters(adapter_alias)
    model.eval()
    model.to(device)
    return model


# Import constants from the local constants module
class Embedder:
    def __init__(
        self,
        batch_size: int = EMBEDDER_BATCH_SIZE,
        device: Optional[str] = None,
        sample: Optional[int] = None,
        # DI-configurable model/tokenizer creation
        base_model_name: str = EMBEDDER_BASE_MODEL_NAME,
        adapter_model_name: str = EMBEDDER_MODEL_NAME,
        adapter_alias: str = "proximity",
        model: Optional[torch.nn.Module] = None,
        tokenizer: Optional[AutoTokenizer] = None,
    ):
        self.batch_size = batch_size
        self.sample = sample

        self.device = torch.device(device if device else ('cuda' if torch.cuda.is_available() else 'cpu'))

        # Persist model config
        self.base_model_name = base_model_name
        self.adapter_model_name = adapter_model_name
        self.adapter_alias = adapter_alias

        self.embedding_dim = EMBEDDER_EMBEDDING_DIM

        # Inject or construct dependencies
        self.model = model or create_adapter_model(
            base_model_name=self.base_model_name,
            adapter_model_name=self.adapter_model_name,
            device=self.device,
            adapter_alias=self.adapter_alias,
        )
        if model is not None:
            self.model.to(self.device)
            self.model.eval()

        self.tokenizer = tokenizer or AutoTokenizer.from_pretrained(self.base_model_name)

        self.embeddings: Optional[np.ndarray] = None
        self.paper_ids: List[str] = []

    def embed_batch(self, texts: List[str]) -> np.ndarray:
        inputs = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
            return_token_type_ids=False
        ).to(self.device)

        with torch.inference_mode():
            outputs = self.model(**inputs)
            embeddings = outputs.last_hidden_state[:, 0, :]
            embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)

        return embeddings.cpu().numpy()

    def embed_text_list(self, text_list: List[str]) -> np.ndarray:
        """Embed a list of texts in batches.
        Args:
            text_list: List of texts to embed.

        Returns:
            Numpy array of shape (len(text_list), embedding_dim) in the same order as text_list.
        """
        all_embeddings = []

        for i in tqdm(range(0, len(text_list), self.batch_size), desc="Embedding search_texts"):

            embeddings = self.embed_batch(text_list[i:i + self.batch_size])
            all_embeddings.append(embeddings)

        return np.vstack(all_embeddings)

    def save_embeddings(self, embeddings: np.ndarray, paper_ids: List[str], output_path: str) -> None:
        if self.embeddings is None:
            raise ValueError("Embeddings not computed")

        np.savez_compressed(
            output_path,
            embeddings=embeddings,
            paper_ids=paper_ids,
            model=f"{self.adapter_model_name}_{self.adapter_alias}",
            dimension=embeddings.shape[1],
        )

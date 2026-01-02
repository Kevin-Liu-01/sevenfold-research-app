from typing import List

from core.embedder import Embedder
from orm.publ_corpus_row import PublCorpusRow
from orm.paper_attr_row import PaperAttrRow

class ArxivEmbedder:
    """Helper for embedding publ_rows before upload."""

    def __init__(self, embedder: Embedder):
        self.embedder = embedder

    def embed_publ_rows(self, publ_rows: List[PublCorpusRow], paper_rows: List[PaperAttrRow]) -> None:
        """Embed the title and abstract of each PublCorpusRow in publ_rows in place using the corresponding PaperAttrRow.

        Parameters:
            publ_rows (List[PublCorpusRow]): List of PublCorpusRow objects to embed.
        """
        if not publ_rows:
            return
        sep_token = self.embedder.tokenizer.sep_token
        texts_to_embed = [
            row.title +
            sep_token +
            row.abstract for row in paper_rows]
        for i in range(0, len(texts_to_embed), self.embedder.batch_size):
            batch_texts = texts_to_embed[i:i + self.embedder.batch_size]
            batch_embeddings = self.embedder.embed_text_list(batch_texts)
            for j, emb in enumerate(batch_embeddings):
                publ_rows[i + j].embedding = emb.tolist()


#!/usr/bin/env python3

"""
PublCorpusRow: Data structure for a single row in the publication corpus.
"""

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

import numpy as np
from pydantic import BaseModel, validator

class PublCorpusRow(BaseModel):
    paper_id: UUID
    search_text: str # title + authors
    abstract_text: str # abstract
    embedding: List[float] = None
    fts: Optional[Dict[str, List[int]]] = None
    source: str
    source_id: str
    created_at: Optional[datetime] = None
    year: int

    @validator('embedding', pre=True)
    def convert_ndarray(cls, v):
        if isinstance(v, np.ndarray):
            return v.tolist()
        return v


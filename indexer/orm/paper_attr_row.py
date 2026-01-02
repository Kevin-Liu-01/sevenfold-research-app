#!/usr/bin/env python3

"""
paper_attr_row: Data structure for a single row in the paper attributes table.
"""

from pydantic import BaseModel

from uuid import UUID
from typing import Optional, List
from datetime import datetime

class PaperAttrRow(BaseModel):
    id: UUID
    title: str
    abstract: str
    authors: List[str]
    year: int
    month: int 
    day: int
    doi: Optional[str]
    category: Optional[str]
    pdf_uri: str
    created_at: Optional[datetime] = None



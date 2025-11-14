from pydantic import BaseModel
from typing import Optional, Literal


class CompositionCreate(BaseModel):
    project_id: str
    type: Literal["docx", "latex", "markdown"]
    title: Optional[str] = None
    contents: Optional[str] = None


class CompositionUpdate(BaseModel):
    title: Optional[str] = None
    contents: Optional[str] = None
    type: Optional[Literal["docx", "latex", "markdown"]] = None


class CompositionResponse(BaseModel):
    id: str
    project_id: str
    type: str
    title: Optional[str]
    contents: Optional[str]


class CompositionChunkCreate(BaseModel):
    composition_id: str
    project_id: str
    content_hash: str
    chunk_text: str
    start_line: int
    end_line: int
    embedding: Optional[list[float]] = None


class CompositionChunkResponse(BaseModel):
    id: str
    composition_id: str
    project_id: str
    content_hash: str
    chunk_text: str
    start_line: int
    end_line: int
    embedding: Optional[list[float]]
    created_at: str
    updated_at: str


class PaperChunkCreate(BaseModel):
    paper_id: str
    chunk_text: str
    start_line: int
    end_line: int
    embedding: Optional[list[float]] = None


class PaperChunkResponse(BaseModel):
    id: str
    paper_id: str
    chunk_text: str
    start_line: int
    end_line: int
    embedding: Optional[list[float]]
    created_at: str
    updated_at: str

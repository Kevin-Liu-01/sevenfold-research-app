from pydantic import BaseModel
from typing import Optional, Literal


class CompositionCreate(BaseModel):
    project_id: str
    type: Literal["latex", "markdown"]
    title: Optional[str] = None
    contents: Optional[str] = None


class CompositionUpdate(BaseModel):
    title: Optional[str] = None
    contents: Optional[str] = None
    type: Optional[Literal["latex", "markdown"]] = None


class CompositionResponse(BaseModel):
    id: str
    project_id: str
    type: str
    title: Optional[str]
    contents: Optional[str]

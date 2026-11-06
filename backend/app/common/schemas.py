from pydantic import BaseModel
from typing import Generic, TypeVar, List, Dict

T = TypeVar("T")

class PaginationMeta(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    meta: PaginationMeta
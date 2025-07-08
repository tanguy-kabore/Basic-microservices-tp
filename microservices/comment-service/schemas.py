from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CommentBase(BaseModel):
    content: str
    author: str

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: int
    article_id: int
    created_at: datetime

    class Config:
        orm_mode = True

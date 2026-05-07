"""
FastAPI Backend — REST API for the RAG Chatbot.
Endpoints: /upload, /query, /reset, /health
"""

import os
import shutil
import tempfile
from typing import List

# Load environment variables FIRST
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import after loading .env
from app.rag_engine import RAGEngine


app = FastAPI(
    title="RAG Chatbot API",
    description="Production-grade Retrieval-Augmented Generation chatbot using LangChain + FAISS + GPT",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create shared RAG engine
engine = RAGEngine()


# ─────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]


class UploadResponse(BaseModel):
    message: str
    documents_loaded: int
    chunks_created: int


class HealthResponse(BaseModel):
    status: str
    indexed: bool
    model: str


# ─────────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    return {
        "status": "ok",
        "indexed": engine.vectorstore is not None,
        "model": engine.model_name,
    }


# ─────────────────────────────────────────────────────────────
# Upload Documents
# ─────────────────────────────────────────────────────────────

@app.post("/upload", response_model=UploadResponse, tags=["Documents"])
async def upload_documents(files: List[UploadFile] = File(...)):

    tmp_dir = tempfile.mkdtemp()
    saved_paths = []

    try:
        for file in files:

            # Allow only PDF and TXT
            if not file.filename.endswith((".pdf", ".txt")):
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file.filename}"
                )

            # Save uploaded file temporarily
            dest = os.path.join(tmp_dir, file.filename)

            with open(dest, "wb") as f:
                shutil.copyfileobj(file.file, f)

            saved_paths.append(dest)

        # Process documents
        result = engine.ingest_documents(saved_paths)

        return {
            "message": f"Successfully indexed {len(files)} file(s)",
            "documents_loaded": result["documents_loaded"],
            "chunks_created": result["chunks_created"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────────────────────
# Query Chatbot
# ─────────────────────────────────────────────────────────────

@app.post("/query", response_model=QueryResponse, tags=["Chat"])
def query(request: QueryRequest):

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    try:
        result = engine.query(request.question)
        return result

    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# Reset Memory
# ─────────────────────────────────────────────────────────────

@app.post("/reset", tags=["Chat"])
def reset_memory():

    engine.reset_memory()

    return {
        "message": "Conversation memory cleared"
    }


# ─────────────────────────────────────────────────────────────
# Root Endpoint
# ─────────────────────────────────────────────────────────────

@app.get("/", tags=["System"])
def root():

    return {
        "message": "RAG Chatbot API is running",
        "docs": "/docs",
        "health": "/health"
    }
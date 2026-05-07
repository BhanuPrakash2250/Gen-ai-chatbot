"""
Tests for RAG Chatbot API.
Run: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import io

from app.main import app

client = TestClient(app)


# ── Health ────────────────────────────────────────────────────────────────────

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "indexed" in data
    assert "model" in data


def test_root():
    response = client.get("/")
    assert response.status_code == 200


# ── Upload ────────────────────────────────────────────────────────────────────

def test_upload_unsupported_type():
    files = [("files", ("test.docx", io.BytesIO(b"content"), "application/octet-stream"))]
    response = client.post("/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


@patch("app.main.engine")
def test_upload_txt(mock_engine):
    mock_engine.ingest_documents.return_value = {
        "documents_loaded": 1,
        "chunks_created": 5,
        "index_saved": "faiss_index",
    }
    files = [("files", ("test.txt", io.BytesIO(b"Hello world. This is test content."), "text/plain"))]
    response = client.post("/upload", files=files)
    assert response.status_code == 200
    assert response.json()["documents_loaded"] == 1
    assert response.json()["chunks_created"] == 5


# ── Query ─────────────────────────────────────────────────────────────────────

def test_query_empty_question():
    response = client.post("/query", json={"question": "  "})
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


@patch("app.main.engine")
def test_query_no_index(mock_engine):
    mock_engine.query.side_effect = RuntimeError("No documents indexed.")
    response = client.post("/query", json={"question": "What is RAG?"})
    assert response.status_code == 400


@patch("app.main.engine")
def test_query_success(mock_engine):
    mock_engine.query.return_value = {
        "answer": "RAG stands for Retrieval-Augmented Generation.",
        "sources": [{"source": "doc.pdf", "page": 1, "snippet": "RAG is..."}],
    }
    response = client.post("/query", json={"question": "What is RAG?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
    assert data["answer"] == "RAG stands for Retrieval-Augmented Generation."


# ── Reset ─────────────────────────────────────────────────────────────────────

@patch("app.main.engine")
def test_reset_memory(mock_engine):
    response = client.post("/reset")
    assert response.status_code == 200
    assert "cleared" in response.json()["message"].lower()

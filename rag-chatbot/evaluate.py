"""
RAGAS Evaluation — Measures RAG pipeline quality.
Metrics: Faithfulness, Answer Relevancy, Context Recall, Context Precision

Run:
    python evaluate.py
"""

import os
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_recall,
    context_precision,
)
from app.rag_engine import RAGEngine

# ── Sample QA pairs for evaluation ───────────────────────────────────────────
# Replace these with questions relevant to your uploaded documents.

EVAL_DATASET = [
    {
        "question": "What is the main topic of the document?",
        "ground_truth": "The document covers the primary subject matter in detail.",
    },
    {
        "question": "Summarize the key findings.",
        "ground_truth": "The key findings include the main conclusions of the document.",
    },
    {
        "question": "What recommendations are provided?",
        "ground_truth": "The document provides recommendations based on the analysis.",
    },
]


def run_evaluation():
    engine = RAGEngine()

    if engine.vectorstore is None:
        print("No FAISS index found. Please ingest documents first via the API.")
        return

    questions, answers, contexts, ground_truths = [], [], [], []

    for item in EVAL_DATASET:
        result = engine.query(item["question"])
        questions.append(item["question"])
        answers.append(result["answer"])
        contexts.append([s["snippet"] for s in result["sources"]])
        ground_truths.append(item["ground_truth"])
        engine.reset_memory()

    dataset = Dataset.from_dict({
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "ground_truth": ground_truths,
    })

    print("\n📊 Running RAGAS evaluation...\n")
    results = evaluate(
        dataset,
        metrics=[faithfulness, answer_relevancy, context_recall, context_precision],
    )

    print("=" * 50)
    print("RAGAS Evaluation Results")
    print("=" * 50)
    for metric, score in results.items():
        print(f"  {metric:<25} {score:.4f}")
    print("=" * 50)

    return results


if __name__ == "__main__":
    run_evaluation()

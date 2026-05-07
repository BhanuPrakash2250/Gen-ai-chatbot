import os
from dotenv import load_dotenv

load_dotenv()

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader
)

# Load environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


class RAGEngine:

    def __init__(self):

        self.model_name = "llama-3.1-8b-instant"

        # Embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        # Groq LLM
        self.llm = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name=self.model_name
        )

        self.vectorstore = None

        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

        self.qa_chain = None

    # ---------------------------------------------------------
    # Load Documents
    # ---------------------------------------------------------

    def load_documents(self, file_paths):

        documents = []

        for path in file_paths:

            if path.endswith(".pdf"):
                loader = PyPDFLoader(path)

            elif path.endswith(".txt"):
                loader = TextLoader(path)

            else:
                continue

            documents.extend(loader.load())

        return documents

    # ---------------------------------------------------------
    # Ingest Documents
    # ---------------------------------------------------------

    def ingest_documents(self, file_paths):

        docs = self.load_documents(file_paths)

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

        chunks = splitter.split_documents(docs)

        self.vectorstore = FAISS.from_documents(
            chunks,
            self.embeddings
        )

        retriever = self.vectorstore.as_retriever()

        self.qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=retriever,
            memory=self.memory
        )

        return {
            "documents_loaded": len(docs),
            "chunks_created": len(chunks)
        }

    # ---------------------------------------------------------
    # Query
    # ---------------------------------------------------------

    def query(self, question):

        # If documents uploaded → use RAG
        if self.qa_chain is not None:

            result = self.qa_chain.invoke({
                "question": question
            })

            source_docs = result.get("source_documents", [])

            sources = []

            for doc in source_docs:
                sources.append({
                    "content": doc.page_content[:300]
                })

            return {
                "answer": result["answer"],
                "sources": sources
            }

        # If no documents uploaded → normal AI chat
        else:

            response = self.llm.invoke(question)

            return {
                "answer": response.content,
                "sources": []
            }

    # ---------------------------------------------------------
    # Reset Memory
    # ---------------------------------------------------------

    def reset_memory(self):

        self.memory.clear()
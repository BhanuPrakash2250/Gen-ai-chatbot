# Lumina AI — Full Stack AI SaaS Chatbot

Modern AI chatbot platform inspired by ChatGPT, Claude, and Gemini.

Built using React, TypeScript, FastAPI, Groq LLM, LangChain, and FAISS with a modern SaaS-style UI.

---

# 🚀 Features

- Modern ChatGPT-style interface
- AI-powered conversations
- Fast Groq LLM responses
- Voice input support
- Markdown rendering
- Code syntax highlighting
- Dark / Light mode
- Responsive SaaS UI
- Chat history persistence
- Glassmorphism design
- Mobile-friendly layout
- Real-time typing animation
- Copy AI responses
- FastAPI backend
- LangChain integration
- FAISS vector database
- Full-stack deployment ready

---

# 🛠️ Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Markdown
- React Icons
- React Syntax Highlighter

## Backend

- FastAPI
- Python
- LangChain
- Groq API
- FAISS
- HuggingFace Embeddings

---

# 📂 Project Structure

```bash
rag-chatbot-langchain-faiss/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── rag-chatbot/
│   ├── app/
│   ├── uploads/
│   ├── requirements.txt
│   └── main.py
│
├── README.md
└── .gitignore




Frontend Setup
cd frontend

npm install

npm run dev


Backend Setup

cd rag-chatbot
Create virtual environment:

python -m venv venv

Activate environment:

Windows
venv\Scripts\activate
Install dependencies:

pip install -r requirements.txt

Run backend:

uvicorn app.main:app --reload --port 8000
GROQ_API_KEY=your_groq_api_key
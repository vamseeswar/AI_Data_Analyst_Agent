# AI Data Analyst Agent

A full-stack, production-ready AI Data Analyst platform that allows users to upload datasets and receive AI-generated insights, machine learning predictions (Time Series Forecasting), and interactive visualizations.

## 🚀 Architecture Overview

- **Frontend:** React (Vite), Tailwind CSS, Recharts, Lucide Icons
- **Backend:** FastAPI, Python, Pandas, Prophet, Scikit-learn
- **AI/LLM:** Groq API (llama3-70b-8192) for fast, structured insights and chat context.
- **Memory/Vector DB:** FAISS + SentenceTransformers to persist and retrieve query history context intelligently.

## 📁 Project Structure

```
ai-data-analyst-agent/
├── frontend/             # React (Vite) + Tailwind CSS + Recharts
├── backend/              # FastAPI Python Backend
│   ├── routes/           # API endpoints (analyze, chat)
│   ├── services/         # Orchestration (Groq LLM calls, Dataset analysis)
│   ├── ml/               # Machine Learning (Prophet Time Series, Sklearn)
│   ├── prompts/          # LLM Prompt Templates
│   ├── utils/            # Data processing utilities
│   ├── database/         # FAISS Vector Memory System
│   ├── main.py           # FastAPI Entry Point
│   └── requirements.txt  # Python dependencies
├── tests/                # Pytest unit tests
└── README.md             # Documentation
```

## 🧠 Core Features

1. **Natural Language Querying:** Ask questions about your dataset via the chat interface, retaining context through FAISS vector memory.
2. **Automated Insights:** Automatically extracts Trends, Anomalies, and Recommendations using Groq's LLMs.
3. **Machine Learning Predictions:** Detects Date and Numeric columns to automatically run Time Series Forecasting using Prophet.
4. **Data Visualizations:** Dynamic UI that plots ML forecasts or displays insights effectively using `recharts`.

## ⚙️ Setup & Installation

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Set your Groq API Key:
   ```bash
   export GROQ_API_KEY="your_api_key_here" # On Windows: set GROQ_API_KEY=...
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## 🚀 Deployment Guide

### Backend (Render / Heroku)
1. Add a `Procfile` for Heroku/Render or simply set the start command to:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
2. Make sure to define the `GROQ_API_KEY` in your environment variables.

### Frontend (Vercel / Netlify)
1. In the frontend directory, the build command is `npm run build`.
2. Ensure the output directory is `dist`.
3. Set any API base URLs to point to your live backend domain instead of `localhost:8000`.

### Docker
A generic Dockerfile can be added to the backend directory:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

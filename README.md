# 🧠 CyberSec Chatbot with RAG Memory & PDF Source Reference

A smart, retrieval-augmented AI chatbot built with **Flask**, **LangChain**, and **TypeScript** that can answer cybersecurity questions by understanding your PDF documents and remembering previous conversations.

---

## 📌 Features

- ✅ Simple web-based chat interface
- 📚 Reads and answers from PDFs in the `data/` folder
- 🧠 RAG Memory: remembers your questions and answers across a session
- 📎 Optional checkbox to show source documents in responses
- ⚡ Powered by OpenAI's GPT and LangChain's vector store (FAISS)
- 🔧 Fully local setup — no Azure required

---

## 🗂️ Project Structure

cybersec-chatbot/
│
-
├── app.py # Flask backend server
-
├── rag_loader.py # Loads PDFs and builds FAISS vector DB
-
├── .env # Stores OpenAI API key
-
├── requirements.txt # Python dependencies
-
├── tsconfig.json # TypeScript config
-
├── dist/ # Compiled JS (from script.ts)
-
├── static/
-
│ └── script.ts # TypeScript source
-
├── templates/
-
│ └── index.html # Chat UI
-
├── data/ # Folder for your PDF documents
-
└── faiss_index/ # Auto-generated vector DB

---------

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/cybersec-chatbot.git
cd cybersec-chatbot

```
---

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate


## pip install -r requirements.txt


Create a .env file in the root with:
---
OPENAI_API_KEY=your-openai-key
''
python rag_loader.py
''


---

Make sure to convert your TS to JS:

npx tsc
""
This compiles static/script.ts into dist/script.js.
""
---

🌐 Deployment (Optional)
""
This app can be deployed on platforms like Render, Replit, or Railway.
""
Just ensure:
""
requirements.txt is updated
""
You use a production server like gunicorn app:app
""

----


📖 License
-
MIT © 2025 — Built with ❤️ by Snehanshu
''
[https://cyby-sec.onrender.com]
''

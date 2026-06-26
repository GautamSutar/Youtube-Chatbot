# 🤖 YouTube AI Chatbot

![YouTube AI Chatbot](youtube.png)

An intelligent YouTube Chatbot built with LangChain and FastAPI. It uses Retrieval-Augmented Generation (RAG) to query video transcripts, answer user questions, and generate concise summaries in real-time. Features an interactive UI via a Chrome Extension, seamless YouTube API integration, and advanced conversational memory for highly contextual, accurate video insights.

---

## ✨ Features

- **Real-Time Q&A**: Ask any question about the YouTube video you are currently watching.
- **RAG Architecture**: Uses OpenAI embeddings and FAISS vector database to search through transcripts and retrieve context accurately.
- **Chrome Extension**: A beautifully designed, easy-to-use popup that connects seamlessly to the backend right on your YouTube page.
- **Bypass IP Blocks**: Uses a local `cookies.txt` strategy to fetch transcripts reliably without getting blocked by YouTube's anti-bot mechanisms.
- **FastAPI Backend**: High performance, async-ready Python backend.

---

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, Uvicorn
- **AI & LLMs**: LangChain, OpenAI (`gpt-4o-mini`), OpenAI Embeddings
- **Vector Database**: FAISS
- **Frontend**: HTML/CSS/JS (Chrome Extension)
- **Deployment**: Render, Heroku

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9+
- Chrome Browser
- OpenAI API Key

### 2. Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GautamSutar/Youtube-Chatbot.git
   cd Youtube-Chatbot
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory and add your OpenAI API Key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Set up `cookies.txt` (Crucial for Cloud Deployment & Bypassing IP Blocks):**
   - Use a browser extension like "Get cookies.txt LOCALLY" to export your YouTube cookies.
   - Save the file exactly as `cookies.txt` in the root directory.
   - *Note: YouTube frequently blocks cloud IPs from downloading transcripts. This file is required to securely authenticate requests.*

6. **Run the Server:**
   ```bash
   python server.py
   # The server will start on http://127.0.0.1:8000
   ```

### 3. Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right corner).
3. Click on **Load unpacked** and select the `extension` folder from this repository.
4. Pin the extension to your toolbar.
5. Open any YouTube video and click the extension icon to start asking questions!

---

## ☁️ Deployment

If you plan to deploy the backend to a cloud provider like **Render** or **Heroku**:
1. Ensure your `cookies.txt` is tracked and committed to your Git repository:
   ```bash
   git add cookies.txt
   git commit -m "Add cookies.txt"
   git push
   ```
2. The `Procfile` is already configured for deployment (`web: uvicorn server:app --host 0.0.0.0 --port $PORT`).
3. Set your `OPENAI_API_KEY` as an environment variable in your cloud provider's dashboard.
4. Update the endpoint URL in your Chrome Extension to point to your deployed cloud URL.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

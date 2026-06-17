import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# Load environment variables
load_dotenv()
if not os.getenv("OPENAI_API_KEY"):
    raise Exception("OPENAI_API_KEY is not set in the .env file.")

app = FastAPI()

# Allow CORS for the Chrome Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache for RAG chains to avoid re-fetching and embedding 
# the transcript for every single question on the same video.
chain_cache = {}

class ChatRequest(BaseModel):
    video_id: str
    question: str

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def build_rag_chain_for_video(video_id: str):
    try:
        # 1. Fetch Transcript
        transcript_obj = YouTubeTranscriptApi().fetch(video_id, languages=["en", "hi", "ur"])
        transcript_text = " ".join([segment.text for segment in transcript_obj.snippets])
        
        # 2. Split Text
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = splitter.create_documents([transcript_text])
        
        # 3. Embed & Vectorize
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vector_store = FAISS.from_documents(chunks, embeddings)
        
        # 4. Setup Retriever
        retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 4})
        
        # 5. Setup LLM and Prompt
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
        prompt = PromptTemplate(
            template="""
            You are a helpful assistant.
            Answer ONLY from the provided transcript context.
            If the context is insufficient, just say you don't know.

            {context}
            Question: {question}
            """,
            input_variables=['context', 'question']
        )
        
        # 6. Build LCEL Chain
        rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        
        return rag_chain

    except TranscriptsDisabled:
        raise HTTPException(status_code=400, detail="No captions available for this video.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(request: ChatRequest):
    # 1. Check if we already built the FAISS index for this video
    if request.video_id not in chain_cache:
        print(f"Building index for video {request.video_id}...")
        rag_chain = build_rag_chain_for_video(request.video_id)
        chain_cache[request.video_id] = rag_chain
    else:
        print(f"Using cached index for video {request.video_id}...")
        rag_chain = chain_cache[request.video_id]
        
    # 2. Query the chain
    try:
        answer = rag_chain.invoke(request.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI Server...")
    uvicorn.run(app, host="127.0.0.1", port=8000)

import os
import warnings
from dotenv import load_dotenv

# Suppress LangChain deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)


from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser

# Load environment variables from the .env file
load_dotenv()

# Retrieve the API key and base URL
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")

video_id = "UclrVWafRAI"
def get_youtube_transcript(video_id):
    try: 
        transcript_obj = YouTubeTranscriptApi().fetch(video_id, languages=["en", "hi", "ur"])
        transcript_text = " ".join([segment.text for segment in transcript_obj.snippets])
        
        print(f"\n[SUCCESS] Transcript successfully loaded!")
        print(f"Transcript length: {len(transcript_text)} characters.")
        print(f"Preview: {transcript_text[:200]}...\n")
        # print(f"Transcript Text: {transcript_text}")
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = splitter.create_documents([transcript_text])
        print(len(chunks))
        print(chunks[100])
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vector_store = FAISS.from_documents(chunks, embeddings)
        # print(vector_store.index_to_docstore_id)
        # Note: Document IDs change on every run, so hardcoding an ID like below will cause errors
        # print(vector_store.get_by_ids(['80f6d25a-5071-4964-8474-8cb23150de90']))
        
        retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 4})
        print("\n[SUCCESS] Retriever created successfully!")
        # print(retriever)
        # print(retriever.invoke('What is super ai'))
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
        prompt = PromptTemplate(
            template="""
            You are a helpful assistant.
            Answer ONLY from the provided transcript context.
      If the context is insufficient, just say you don't know.

      {context}
      Question: {question}
    """,
    input_variables = ['context', 'question']
        )
        question1 = "is the topic of super ai discussed in this video? if yes then what was discussed"
        print(f"[QUESTION] {question1}")
        retrieved_docs = retriever.invoke(question1)
        context_text = "\n\n".join(doc.page_content for doc in retrieved_docs)
        final_prompt = prompt.invoke({"context": context_text, "question": question1}) 
        answer1 = llm.invoke(final_prompt)
        print(f"Answer: {answer1.content}\n")
        
        # ---------------------------------------------------------
        # LCEL Method (LangChain Expression Language)
        # ---------------------------------------------------------
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        rag_chain = (
            {"context": retriever | RunnableLambda(format_docs), "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        
        question2 = 'who is Demis'
        print(f"[QUESTION] {question2}")
        answer2 = rag_chain.invoke(question2)
        print(f"Answer: {answer2}\n")

        question3 = 'Can you summarize the video'
        print(f"[QUESTION] {question3}")
        answer3 = rag_chain.invoke(question3)
        print(f"Answer: {answer3}\n")
        
        return retrieved_docs
    except TranscriptsDisabled:
        print("No captions available for this video.")


if __name__ == "__main__":
    if OPENAI_API_KEY:
        print("API Key loaded successfully!\n")
        
        # Test getting a transcript for the defined video_id
        print(f"Fetching transcript for video ID: {video_id} ...")
        get_youtube_transcript(video_id)
        
    else:
        print("Failed to load API Key. Please check your .env file.")

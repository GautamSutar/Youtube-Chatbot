document.addEventListener('DOMContentLoaded', async () => {
  const statusBox = document.getElementById('statusBox');
  const chatContainer = document.getElementById('chatContainer');
  const input = document.getElementById('questionInput');
  const sendBtn = document.getElementById('sendBtn');
  
  let currentVideoId = null;

  // 1. Detect YouTube Video
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (activeTab.url && activeTab.url.includes('youtube.com/watch')) {
      const urlParams = new URL(activeTab.url).searchParams;
      currentVideoId = urlParams.get('v');
      
      if (currentVideoId) {
        statusBox.textContent = '✅ Connected to video!';
        statusBox.className = 'status-box success';
        input.disabled = false;
        sendBtn.disabled = false;
      } else {
        showError('Could not find video ID.');
      }
    } else {
      showError('Please open a YouTube video.');
    }
  } catch (err) {
    showError('Error accessing tab.');
  }

  function showError(msg) {
    statusBox.textContent = msg;
    statusBox.className = 'status-box error';
    input.disabled = true;
    sendBtn.disabled = true;
  }

  // 2. Chat UI Functions
  function appendUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user';
    msgDiv.innerHTML = `
      <div class="avatar">U</div>
      <div class="bubble">${text}</div>
    `;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function appendAIMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai';
    msgDiv.innerHTML = `
      <div class="avatar">AI</div>
      <div class="bubble">${text}</div>
    `;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return msgDiv;
  }

  function showTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai typing-indicator';
    msgDiv.innerHTML = `
      <div class="avatar">AI</div>
      <div class="bubble">
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return msgDiv;
  }

  // 3. Handle Send
  async function handleSend() {
    const question = input.value.trim();
    if (!question || !currentVideoId) return;

    appendUserMessage(question);
    input.value = '';
    
    const typingMsg = showTypingIndicator();

    try {
      const response = await fetch('http://127.0.0.1:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: currentVideoId,
          question: question
        })
      });

      typingMsg.remove();

      if (!response.ok) {
        const errorData = await response.json();
        appendAIMessage(`Error: ${errorData.detail || 'Something went wrong.'}`);
        return;
      }

      const data = await response.json();
      appendAIMessage(data.answer);

    } catch (err) {
      typingMsg.remove();
      appendAIMessage('Failed to connect to the local AI server. Make sure server.py is running on port 8000.');
    }
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
});

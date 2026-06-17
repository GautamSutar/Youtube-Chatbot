document.addEventListener('DOMContentLoaded', async () => {
  const statusBox = document.getElementById('statusBox');
  const statusText = document.getElementById('statusText');
  const chatContainer = document.getElementById('chatContainer');
  const input = document.getElementById('questionInput');
  const sendBtn = document.getElementById('sendBtn');
  
  const soundToggle = document.getElementById('soundToggle');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');
  
  let currentVideoId = null;
  let soundEnabled = true;

  // Sound Setup
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundOnIcon.style.display = 'block';
      soundOffIcon.style.display = 'none';
    } else {
      soundOnIcon.style.display = 'none';
      soundOffIcon.style.display = 'block';
    }
  });

  function playSendSound() {
    if (!soundEnabled) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  function playReceiveSound() {
    if (!soundEnabled) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  // 1. Detect YouTube Video
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    if (activeTab.url && activeTab.url.includes('youtube.com/watch')) {
      const urlParams = new URL(activeTab.url).searchParams;
      currentVideoId = urlParams.get('v');
      
      if (currentVideoId) {
        statusText.textContent = 'Connected to video!';
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
    statusText.textContent = msg;
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

    playSendSound();
    appendUserMessage(question);
    input.value = '';
    
    const typingMsg = showTypingIndicator();

    try {
      const response = await fetch('https://youtube-ai-chatbot-v65i.onrender.com/ask', {
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
      playReceiveSound();
      appendAIMessage(data.answer);

    } catch (err) {
      typingMsg.remove();
      appendAIMessage('Failed to connect to the cloud AI server.');
    }
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
});

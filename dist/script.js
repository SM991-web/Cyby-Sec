"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

// Wait for DOM to load before accessing elements
document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const chatForm = document.getElementById("chatForm");
  const messageInput = document.getElementById("message");
  const chatHistory = document.getElementById("chat-history");
  const sourceCheck = document.getElementById("sourceCheck");
  const newChatBtn = document.getElementById("newChatBtn");
  
  // History elements
  const historyBtn = document.getElementById("historyBtn");
  const historyPanel = document.getElementById("historyPanel");
  const closeHistoryBtn = document.getElementById("closeHistoryBtn");
  const historyList = document.getElementById("historyList");
  
  // Conversation state
  let conversationId = generateConversationId();
  let messages = [];
  
  // Initialize the chat
  addWelcomeMessage();
  
  // Event listeners
  chatForm.addEventListener("submit", handleSubmit);
  newChatBtn.addEventListener("click", startNewChat);
  
  // Add event listeners for history panel if elements exist
  if (historyBtn) historyBtn.addEventListener("click", toggleHistoryPanel);
  if (closeHistoryBtn) closeHistoryBtn.addEventListener("click", toggleHistoryPanel);
  
  // Generate unique conversation ID
  function generateConversationId() {
    return 'conv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  // Add welcome message
  function addWelcomeMessage() {
    const welcomeMessage = {
      role: "assistant",
      content: "What can I Assist you with Today?",
      sources: []
    };
    
    addMessageToHistory(welcomeMessage);
    messages.push(welcomeMessage);
  }
  
  // Start a new chat
  function startNewChat() {
    conversationId = generateConversationId();
    messages = [];
    chatHistory.innerHTML = '';
    addWelcomeMessage();
  }
  
  // Toggle history panel visibility
  function toggleHistoryPanel() {
    historyPanel.classList.toggle("show");
    if (historyPanel.classList.contains("show")) {
      loadChatHistory();
    }
  }
  
  // Load chat history from server
  async function loadChatHistory() {
    if (!historyList) return;
    
    historyList.innerHTML = "<div class='loading'>Loading history...</div>";
    
    try {
      const res = await fetch(`/load-chat-history?conversationId=${conversationId}`);
      const data = await res.json();
      
      if (data.success && data.histories.length > 0) {
        historyList.innerHTML = "";
        data.histories.forEach(history => {
          const historyItem = document.createElement("div");
          historyItem.className = "history-item";
          historyItem.innerHTML = `
            <div class="history-info">
              <span>${formatTimestamp(history.timestamp)}</span>
              <span>${history.message_count} messages</span>
            </div>
            <button class="load-chat-btn" data-filename="${history.filename}">
              <i class="fas fa-history"></i> Load
            </button>
          `;
          historyList.appendChild(historyItem);
          
          // Add event listener to load button
          const loadBtn = historyItem.querySelector(".load-chat-btn");
          loadBtn.addEventListener("click", () => loadSpecificChat(history.filename));
        });
      } else {
        historyList.innerHTML = "<div class='empty'>No chat history found</div>";
      }
    } catch (err) {
      historyList.innerHTML = `<div class='error'>Error loading history: ${err.message}</div>`;
    }
  }
  
  // Load a specific chat from history
  async function loadSpecificChat(filename) {
    try {
      const res = await fetch(`/get-chat?filename=${filename}`);
      const data = await res.json();
      
      if (data.success) {
        // Clear current chat
        messages = [];
        chatHistory.innerHTML = "";
        
        // Load saved chat messages
        data.chat.messages.forEach(msg => {
          addMessageToHistory(msg);
          messages.push(msg);
        });
        
        // Update conversation ID to match loaded chat
        conversationId = data.chat.conversation_id;
        
        // Close history panel
        historyPanel.classList.remove("show");
      }
    } catch (err) {
      console.error("Error loading chat:", err);
      const errorElement = document.createElement('div');
      errorElement.className = 'message assistant-message';
      errorElement.innerHTML = `
        <div class="message-header">
          <i class="fas fa-robot"></i> Assistant
        </div>
        <div class="message-content">Error loading chat history</div>
      `;
      chatHistory.appendChild(errorElement);
    }
  }
  
  // Format timestamp for display
  function formatTimestamp(timestamp) {
    // Format: YYYYMMDD_HHMMSS
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(9, 11);
    const minute = timestamp.substring(11, 13);
    
    return `${month}/${day}/${year} ${hour}:${minute}`;
  }
  
  // Handle form submission
  function handleSubmit(e) {
    e.preventDefault();
    
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;
    
    // Add user message to history
    const userMsg = {
      role: "user",
      content: userMessage,
      sources: []
    };
    
    addMessageToHistory(userMsg);
    messages.push(userMsg);
    
    // Add thinking indicator
    const thinkingElement = document.createElement('div');
    thinkingElement.className = 'thinking';
    thinkingElement.innerHTML = `
      <div class="message-header">
        <i class="fas fa-robot"></i> Assistant
      </div>
      <div class="thinking-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    chatHistory.appendChild(thinkingElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // Clear input
    messageInput.value = '';
    
    // Send to server
    sendToServer(userMessage);
  }
  
  // Add message to chat history UI
  function addMessageToHistory(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role}-message`;
    
    let sourcesHtml = '';
    if (message.sources && message.sources.length > 0) {
      sourcesHtml = `
        <div class="sources-section">
          <h4>Recommended Sources:</h4>
          <ul class="sources-list">
            ${message.sources.map(source => `
              <li>
                <a href="${source.url}" target="_blank" class="pdf-link">
                  <i class="fas fa-file-pdf"></i> ${source.title}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }
    
    messageElement.innerHTML = `
      <div class="message-header">
        <i class="${message.role === 'user' ? 'fas fa-user' : 'fas fa-robot'}"></i>
        ${message.role === 'user' ? 'You' : 'Assistant'}
      </div>
      <div class="message-content">${message.content}</div>
      ${sourcesHtml}
    `;
    
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
  
  // Send message to server
  async function sendToServer(userMessage) {
    const showSources = sourceCheck.checked;
    
    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          showSources,
          conversationId,
          history: messages.slice(-5) // Send last 5 messages for context
        })
      });
    // Save chat history after successful response
    try {
      await fetch("/save-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId,
          messages: messages
        })
      });
    } catch (err) {
      console.error("Error saving chat history:", err);
    }  
      const data = await res.json();
      
      // Remove thinking indicator
      const thinkingElements = document.getElementsByClassName('thinking');
      if (thinkingElements.length > 0) {
        thinkingElements[0].remove();
      }
      
      // Add assistant response to history
      const assistantMessage = {
        role: "assistant",
        content: data.response,
        sources: data.sources || []
      };
      
      addMessageToHistory(assistantMessage);
      messages.push(assistantMessage);
      
      // Save chat history after successful response
      try {
        await fetch("/save-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationId,
            messages: messages
          })
        });
      } catch (err) {
        console.error("Error saving chat history:", err);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      
      // Remove thinking indicator
      const thinkingElements = document.getElementsByClassName('thinking');
      if (thinkingElements.length > 0) {
        thinkingElements[0].remove();
      }
      
      // Show error message
      const errorElement = document.createElement('div');
      errorElement.className = 'message assistant-message';
      errorElement.innerHTML = `
        <div class="message-header">
          <i class="fas fa-robot"></i> Assistant
        </div>
        <div class="message-content">Error: Could not connect to the server. Please try again later.</div>
      `;
      chatHistory.appendChild(errorElement);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  }
});
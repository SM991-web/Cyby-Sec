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
  
  // Conversation state
  let conversationId = generateConversationId();
  let messages = [];
  
  // Initialize the chat
  addWelcomeMessage();
  
  // Event listeners
  chatForm.addEventListener("submit", handleSubmit);
  newChatBtn.addEventListener("click", startNewChat);
  
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
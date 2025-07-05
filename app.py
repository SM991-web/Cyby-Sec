from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import re
import uuid
from datetime import datetime, timedelta
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage, AssistantMessage
from azure.core.credentials import AzureKeyCredential

app = Flask(__name__, static_folder="dist", static_url_path="/dist")

# Azure inference setup
endpoint = "https://models.github.ai/inference"
model = "openai/gpt-4.1"
token = os.getenv("GITHUB_TOKEN")

client = ChatCompletionsClient(
    endpoint=endpoint,
    credential=AzureKeyCredential(token),
)

# Mock PDF database
PDF_DATABASE = {
    "network security": [
        {"title": "Network Security Fundamentals", "url": "/data/network-security.pdf"},
        {"title": "Firewall Configuration Guide", "url": "/data/firewall-guide.pdf"}
    ],
    "phishing": [
        {"title": "Phishing Attack Prevention", "url": "/data/phishing-prevention.pdf"}
    ],
    "encryption": [
        {"title": "Encryption Best Practices", "url": "/data/encryption-guide.pdf"},
        {"title": "Cryptography Fundamentals", "url": "/data/crypto-fundamentals.pdf"}
    ],
    "C++": [
        {"title": "C++ Programming Language", "url": "/data/The_C++_Programming_Language_4th_Edition_Bjarne_Stroustrup.pdf"},
        {"title": "C++ Best Practices", "url": "/data/Modern_C++_Best_Practices.pdf"}
    ],
    "malware": [
        {"title": "Malware Analysis Handbook", "url": "/data/malware-handbook.pdf"},
        {"title": "Advanced Persistent Threats", "url": "/data/apt-guide.pdf"}
    ],
    "compliance": [
        {"title": "GDPR Compliance Guide", "url": "/data/gdpr-guide.pdf"},
        {"title": "HIPAA Security Standards", "url": "/data/hipaa-standards.pdf"}
    ]
}

# Conversation storage
conversations = {}

def find_relevant_sources(question):
    """Find relevant PDF sources based on question keywords"""
    keywords = ["network", "phishing", "encryption", "malware", "firewall", "C++", "compliance", "gdpr", "hipaa"]
    relevant_sources = []
    
    # Simple keyword matching
    for keyword in keywords:
        if keyword in question.lower():
            if keyword in PDF_DATABASE:
                relevant_sources.extend(PDF_DATABASE[keyword])
    
    return relevant_sources[:3]  # Return max 3 sources

def get_conversation(conversation_id):
    """Get or create conversation with automatic cleanup"""
    now = datetime.now()
    
    # Clean up expired conversations (older than 2 hours)
    expired_keys = [cid for cid, conv in conversations.items() 
                   if now - conv["last_activity"] > timedelta(hours=2)]
    for cid in expired_keys:
        del conversations[cid]
    
    # Create new conversation if needed
    if conversation_id not in conversations:
        conversations[conversation_id] = {
            "messages": [
                {"role": "system", "content": "You are a helpful cybersecurity and programming assistant. Provide detailed, accurate information about security topics and programming languages like C++. Answer concisely but thoroughly when possible."}
            ],
            "last_activity": now
        }
    
    # Update activity timestamp
    conversations[conversation_id]["last_activity"] = now
    
    return conversations[conversation_id]

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/dist/script.js")
def serve_script():
    return send_from_directory("dist", "script.js")

@app.route("/data/<filename>")
def serve_pdf(filename):
    return send_from_directory("data", filename)

@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    user_input = data.get("message")
    show_sources = data.get("showSources", False)
    conversation_id = data.get("conversationId")
    
    # Validate input
    if not user_input:
        return jsonify({
            "response": "Please enter a question.",
            "sources": []
        }), 400
    
    # Get conversation context
    conversation = get_conversation(conversation_id)
    
    # Add user message to conversation history
    conversation["messages"].append({
        "role": "user",
        "content": user_input
    })
    
    try:
        # Prepare messages for Azure
        azure_messages = []
        for msg in conversation["messages"][-6:]:
            if msg["role"] == "system":
                azure_messages.append(SystemMessage(msg["content"]))
            elif msg["role"] == "user":
                azure_messages.append(UserMessage(msg["content"]))
            elif msg["role"] == "assistant":
                azure_messages.append(AssistantMessage(msg["content"]))
        
        # Add explicit identity instruction
        azure_messages.insert(0, SystemMessage(
            "You are CyberSec Assistant, a specialized AI for cybersecurity and programming topics. "
            "You never refer to yourself as ChatGPT or OpenAI. "
            "Your responses focus exclusively on cybersecurity and programming subjects. "
            "If asked about your identity, respond: 'I am CyberSec Assistant, your cybersecurity and programming expert'."
        ))
        
        # Get Azure response
        response = client.complete(
            messages=azure_messages,
            temperature=0.7,
            top_p=0.9,
            model=model
        )
        
        # Extract response
        answer = response.choices[0].message.content
        
        # Add assistant response to conversation
        conversation["messages"].append({
            "role": "assistant",
            "content": answer
        })
        
        # Get relevant sources
        sources = []
        if show_sources:
            sources = find_relevant_sources(user_input)
        
        return jsonify({
            "response": answer,
            "sources": sources,
            "conversationId": conversation_id
        })
    except Exception as e:
        app.logger.error(f"Error in ask endpoint: {str(e)}")
        return jsonify({
            "response": f"Sorry, I encountered an error: {str(e)}",
            "sources": [],
            "conversationId": conversation_id
        }), 500


if __name__ == "__main__":
    # Create data directory if it doesn't exist
    os.makedirs("data", exist_ok=True)
    
    # Add debug configuration
    app.run(debug=True, use_reloader=True)
    
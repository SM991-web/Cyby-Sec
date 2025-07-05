# run.py
from waitress import serve
from app import app
import os

if __name__ == "__main__":
    # Create directories
    os.makedirs("data", exist_ok=True)
    os.makedirs("dist", exist_ok=True)
    
    print("Starting server at http://localhost:5000")
    print("Press CTRL+C to exit")
    
    # Start Waitress server
    serve(app, host='0.0.0.0', port=5000)
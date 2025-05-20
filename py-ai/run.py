#!/usr/bin/env python
import os
import sys
import argparse
import uvicorn
import logging

from app.utils.logging import setup_logging
from dotenv import load_dotenv

def main():
    # Load environment variables from .env file
    load_dotenv()
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Kitchen E-commerce AI Service")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind the server to")
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", 8000)), help="Port to bind the server to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    parser.add_argument("--log-level", default="info", help="Log level")
    parser.add_argument("--dev", action="store_true", help="Development mode")
    parser.add_argument("--test", action="store_true", help="Test mode (will not start server)")
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = args.log_level.upper()
    setup_logging(log_level=log_level, log_to_console=True, log_to_file=True)
    
    # Development mode
    if args.dev:
        sys.argv.append("dev")
        os.environ["DEBUG"] = "True"
    
    # Test mode
    if args.test:
        print("Running in test mode, not starting server")
        sys.exit(0)
    
    print(f"Starting server on {args.host}:{args.port}")
    print(f"Log level: {log_level}")
    print(f"Reload: {args.reload}")
    print(f"Workers: {args.workers}")
    print(f"Development mode: {args.dev}")
    
    # Start server
    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers,
        log_level=log_level.lower()
    )

if __name__ == "__main__":
    main()
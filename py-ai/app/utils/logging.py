import logging
import os
import sys
import json
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from datetime import datetime
from typing import Dict, Any, Optional
import traceback

# Create logger as a module-level variable
logger = logging.getLogger("kitchen_ai")

class CustomJsonFormatter(logging.Formatter):
    """
    Custom formatter to output logs in JSON format for easier parsing
    """
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add custom fields
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
            
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
            
        if hasattr(record, "session_id"):
            log_data["session_id"] = record.session_id
            
        if hasattr(record, "duration"):
            log_data["duration_ms"] = record.duration
        
        # Include exception info if available
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        # Include any extra attributes
        for key, value in record.__dict__.items():
            if key not in [
                "args", "asctime", "created", "exc_info", "exc_text", "filename",
                "funcName", "id", "levelname", "levelno", "lineno", "module",
                "msecs", "message", "msg", "name", "pathname", "process",
                "processName", "relativeCreated", "stack_info", "thread", "threadName"
            ]:
                log_data[key] = value
        
        return json.dumps(log_data)

def setup_logging(
    log_level: str = "INFO",
    log_to_console: bool = True,
    log_to_file: bool = True,
    log_file_path: Optional[str] = None,
    rotate_logs: bool = True,
    format_as_json: bool = True,
):
    """
    Configure application logging
    
    Args:
        log_level: The minimum log level to record
        log_to_console: Whether to output logs to console
        log_to_file: Whether to output logs to file
        log_file_path: Path to log file (defaults to logs/app.log)
        rotate_logs: Whether to rotate log files
        format_as_json: Whether to format logs as JSON
    """
    # Convert log level string to constant
    numeric_level = getattr(logging, log_level.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError(f"Invalid log level: {log_level}")
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Define formatter
    if format_as_json:
        formatter = CustomJsonFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    # Console handler
    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # File handler
    if log_to_file:
        if log_file_path is None:
            # Create logs directory if it doesn't exist
            os.makedirs("logs", exist_ok=True)
            log_file_path = "logs/app.log"
        
        if rotate_logs:
            # Use rotating file handler
            file_handler = RotatingFileHandler(
                log_file_path,
                maxBytes=10 * 1024 * 1024,  # 10 MB
                backupCount=5
            )
        else:
            # Use simple file handler
            file_handler = logging.FileHandler(log_file_path)
        
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Set specific loggers for third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    
    # Log initialization
    logger.info(f"Logging initialized with level {log_level}")

class RequestLogger:
    """
    Context manager for logging request handling
    """
    def __init__(
        self, 
        request_id: str, 
        endpoint: str, 
        method: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        self.request_id = request_id
        self.endpoint = endpoint
        self.method = method
        self.user_id = user_id
        self.session_id = session_id
        self.start_time = datetime.utcnow()
    
    def __enter__(self):
        logger.info(
            f"Request started: {self.method} {self.endpoint}",
            extra={
                "request_id": self.request_id,
                "endpoint": self.endpoint,
                "method": self.method,
                "user_id": self.user_id,
                "session_id": self.session_id
            }
        )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.utcnow() - self.start_time).total_seconds() * 1000
        
        if exc_type:
            logger.error(
                f"Request failed: {self.method} {self.endpoint}",
                exc_info=(exc_type, exc_val, exc_tb),
                extra={
                    "request_id": self.request_id,
                    "endpoint": self.endpoint,
                    "method": self.method,
                    "user_id": self.user_id,
                    "session_id": self.session_id,
                    "duration": duration
                }
            )
        else:
            logger.info(
                f"Request completed: {self.method} {self.endpoint}",
                extra={
                    "request_id": self.request_id,
                    "endpoint": self.endpoint,
                    "method": self.method,
                    "user_id": self.user_id,
                    "session_id": self.session_id,
                    "duration": duration
                }
            )

def log_api_request(request, response, duration_ms):
    """Log API request details"""
    # Extract request details
    request_data = {
        "method": request.method,
        "url": str(request.url),
        "path": request.url.path,
        "client_ip": request.client.host,
        "user_agent": request.headers.get("user-agent", ""),
        "status_code": response.status_code,
        "duration_ms": duration_ms
    }
    
    # Log based on status code
    if 200 <= response.status_code < 400:
        logger.info(f"API Request: {request.method} {request.url.path}", extra=request_data)
    else:
        logger.warning(f"API Request Failed: {request.method} {request.url.path}", extra=request_data)
    
    return request_data

def log_model_inference(
    model_name: str,
    input_data: Dict[str, Any],
    output_data: Dict[str, Any],
    duration_ms: float,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None
):
    """Log model inference details"""
    logger.info(
        f"Model inference: {model_name}",
        extra={
            "model_name": model_name,
            "input_data": input_data,
            "output_data": output_data,
            "duration_ms": duration_ms,
            "user_id": user_id,
            "session_id": session_id
        }
    )
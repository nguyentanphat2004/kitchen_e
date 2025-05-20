import logging
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import traceback
import sys

logger = logging.getLogger(__name__)

class APIError(Exception):
    """Custom API error class"""
    def __init__(
        self, 
        message: str, 
        status_code: int = 500, 
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details
        super().__init__(self.message)

def handle_exceptions(exc: Exception) -> JSONResponse:
    """
    Global exception handler for the application
    Returns a standardized JSON response for any exception
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "internal_server_error"
    message = "Internal server error"
    details = None
    
    # Get traceback information
    tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
    trace_str = "".join(tb)
    
    if isinstance(exc, APIError):
        # Handle our custom APIError
        status_code = exc.status_code
        message = exc.message
        error_code = exc.error_code or get_error_code(status_code)
        details = exc.details
        
        # Log based on severity
        if status_code >= 500:
            logger.error(f"API Error: {message}", exc_info=True)
        else:
            logger.warning(f"API Error: {message} - {details}")
            
    elif isinstance(exc, HTTPException):
        # Handle FastAPI HTTPException
        status_code = exc.status_code
        message = exc.detail
        error_code = get_error_code(status_code)
        
        # Log based on severity
        if status_code >= 500:
            logger.error(f"HTTP Exception: {message}", exc_info=True)
        else:
            logger.warning(f"HTTP Exception: {message}")
            
    else:
        # Handle unexpected exceptions
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    # Prepare response
    response = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message
        }
    }
    
    # Add details if available
    if details:
        response["error"]["details"] = details
    
    # Add traceback in development mode
    if "dev" in sys.argv or "--debug" in sys.argv:
        response["error"]["traceback"] = trace_str
    
    return JSONResponse(
        status_code=status_code,
        content=response
    )

def get_error_code(status_code: int) -> str:
    """Map HTTP status codes to error codes"""
    error_map = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        422: "validation_error",
        429: "too_many_requests",
        500: "internal_server_error",
        501: "not_implemented",
        503: "service_unavailable"
    }
    
    return error_map.get(status_code, "unknown_error")

def validation_error(field: str, message: str) -> APIError:
    """Helper to create a validation error"""
    return APIError(
        message=f"Validation error: {message}",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_code="validation_error",
        details={"field": field, "reason": message}
    )

def not_found_error(resource_type: str, resource_id: str) -> APIError:
    """Helper to create a not found error"""
    return APIError(
        message=f"{resource_type} not found",
        status_code=status.HTTP_404_NOT_FOUND,
        error_code="not_found",
        details={"resource_type": resource_type, "resource_id": resource_id}
    )

def authentication_error(message: str = "Authentication required") -> APIError:
    """Helper to create an authentication error"""
    return APIError(
        message=message,
        status_code=status.HTTP_401_UNAUTHORIZED,
        error_code="unauthorized"
    )

def permission_error(message: str = "Permission denied") -> APIError:
    """Helper to create a permission error"""
    return APIError(
        message=message,
        status_code=status.HTTP_403_FORBIDDEN,
        error_code="forbidden"
    )

def rate_limit_error(message: str = "Rate limit exceeded") -> APIError:
    """Helper to create a rate limit error"""
    return APIError(
        message=message,
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        error_code="rate_limit_exceeded"
    )

def database_error(message: str = "Database error", details: Optional[Dict[str, Any]] = None) -> APIError:
    """Helper to create a database error"""
    return APIError(
        message=message,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="database_error",
        details=details
    )

def external_service_error(
    service: str, 
    message: str = "External service error",
    details: Optional[Dict[str, Any]] = None
) -> APIError:
    """Helper to create an external service error"""
    return APIError(
        message=message,
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        error_code="external_service_error",
        details={"service": service, **(details or {})}
    )
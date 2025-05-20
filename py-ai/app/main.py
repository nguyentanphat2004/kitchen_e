from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
from app.utils.logging import setup_logging
from app.utils.error_handler import handle_exceptions
from app.api import chat, face_auth, product_recommendation, recipe_recommendation, speech, user_behavior
from app.config import settings

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Kitchen E-commerce AI Service",
    description="AI microservice for kitchen e-commerce platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.NODE_BACKEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        logger.info(f"Request processed in {process_time:.4f} seconds: {request.method} {request.url.path}")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Error processing request in {process_time:.4f} seconds: {request.method} {request.url.path}")
        return handle_exceptions(e)

# Include routers from each API module
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(face_auth.router, prefix="/api/face-auth", tags=["Face Authentication"])
app.include_router(product_recommendation.router, prefix="/api/recommendations", tags=["Product Recommendations"])
app.include_router(recipe_recommendation.router, prefix="/api/recipes", tags=["Recipe Recommendations"])
app.include_router(speech.router, prefix="/api/speech", tags=["Speech Processing"])
app.include_router(user_behavior.router, prefix="/api/user-behavior", tags=["User Behavior"])

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "kitchen-ai-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
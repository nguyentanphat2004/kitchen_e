from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import logging
import uuid
import os
import aiofiles
from typing import Optional, Dict, Any, List
from app.models.speech_recognition import SpeechModel
from app.utils.db_connector import mongo_client
from app.models.chat_model import ChatModel
from datetime import datetime
from bson import ObjectId
import io

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize models
speech_model = SpeechModel()
chat_model = ChatModel()

class SpeechRecognitionResponse(BaseModel):
    text: str
    confidence: float
    language: str

class TextToSpeechRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "vi-VN-Standard-A"  # Default Vietnamese voice
    language_code: Optional[str] = "vi-VN"

@router.post("/recognize", response_model=SpeechRecognitionResponse)
async def recognize_speech(
    audio_file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    language: str = Form("vi")
):
    """
    Recognize speech from an audio file and convert to text
    """
    try:
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Save uploaded audio temporarily
        temp_audio_path = os.path.join("data/temp", f"{uuid.uuid4()}.wav")
        os.makedirs(os.path.dirname(temp_audio_path), exist_ok=True)
        
        async with aiofiles.open(temp_audio_path, "wb") as temp_file:
            content = await audio_file.read()
            await temp_file.write(content)
        
        # Recognize speech
        start_time = datetime.utcnow()
        result = await speech_model.recognize_speech(temp_audio_path, language)
        response_time = (datetime.utcnow() - start_time).total_seconds() * 1000  # in milliseconds
        
        if not result:
            # Clean up temp file
            os.remove(temp_audio_path)
            
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Could not recognize speech. Please try again."}
            )
        
        recognized_text = result["text"]
        confidence = result["confidence"]
        
        # Log the speech recognition in MongoDB
        log_data = {
            "userId": ObjectId(user_id) if user_id else None,
            "sessionId": session_id,
            "query": recognized_text,
            "response": "",  # Will be filled after chat response
            "intentType": "speech_recognition",
            "querySource": "voice",
            "deviceInfo": {
                "fileType": audio_file.content_type,
                "fileName": audio_file.filename
            },
            "responseTime": response_time,
            "createdAt": datetime.utcnow()
        }
        
        log_id = await mongo_client.insert_one("aiAssistantLogs", log_data)
        
        # Clean up temp file
        os.remove(temp_audio_path)
        
        return {
            "text": recognized_text,
            "confidence": confidence,
            "language": language
        }
    
    except Exception as e:
        # Ensure temp file is cleaned up even if there's an error
        if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
            
        logger.error(f"Error recognizing speech: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recognize speech: {str(e)}"
        )

@router.post("/recognize-and-respond")
async def recognize_and_respond(
    audio_file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    language: str = Form("vi"),
    respond_with_voice: bool = Form(False)
):
    """
    Recognize speech, process as a chat message, and return response
    Optionally return the response as voice
    """
    try:
        # First recognize the speech
        recognition_result = await recognize_speech(audio_file, user_id, session_id, language)
        recognized_text = recognition_result["text"]
        
        if not recognized_text:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Could not recognize speech. Please try again."}
            )
        
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Process recognized text with chat model
        start_time = datetime.utcnow()
        chat_response = await chat_model.generate_response(
            recognized_text,
            language=language,
            user_id=user_id
        )
        response_time = (datetime.utcnow() - start_time).total_seconds() * 1000  # in milliseconds
        
        response_text = chat_response["response"]
        intent_type = chat_response["intent_type"]
        
        # Log the interaction
        log_data = {
            "userId": ObjectId(user_id) if user_id else None,
            "sessionId": session_id,
            "query": recognized_text,
            "response": response_text,
            "intentType": intent_type,
            "querySource": "voice",
            "responseTime": response_time,
            "createdAt": datetime.utcnow()
        }
        
        await mongo_client.insert_one("aiAssistantLogs", log_data)
        
        # If voice response is requested, generate speech
        if respond_with_voice:
            voice_content = await speech_model.text_to_speech(
                response_text,
                language_code=language
            )
            
            # Return the audio content as a streaming response
            return StreamingResponse(
                io.BytesIO(voice_content),
                media_type="audio/mp3",
                headers={
                    "Content-Disposition": f"attachment; filename=response_{uuid.uuid4()}.mp3"
                }
            )
        
        # Otherwise return text response
        return {
            "recognized_text": recognized_text,
            "response": response_text,
            "intent_type": intent_type,
            "session_id": session_id,
            "suggested_actions": chat_response.get("suggested_actions", []),
            "suggested_products": chat_response.get("suggested_products", []),
            "suggested_recipes": chat_response.get("suggested_recipes", [])
        }
    
    except Exception as e:
        logger.error(f"Error in speech recognition and response: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process speech and generate response: {str(e)}"
        )

@router.post("/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to speech
    """
    try:
        voice_content = await speech_model.text_to_speech(
            request.text,
            voice_id=request.voice_id,
            language_code=request.language_code
        )
        
        return StreamingResponse(
            io.BytesIO(voice_content),
            media_type="audio/mp3",
            headers={
                "Content-Disposition": f"attachment; filename=speech_{uuid.uuid4()}.mp3"
            }
        )
    
    except Exception as e:
        logger.error(f"Error in text to speech conversion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to convert text to speech: {str(e)}"
        )

@router.get("/voices")
async def list_available_voices(language_code: Optional[str] = None):
    """
    List available voices for text-to-speech
    """
    try:
        voices = await speech_model.list_voices(language_code)
        return {"voices": voices}
    
    except Exception as e:
        logger.error(f"Error listing voices: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list voices: {str(e)}"
        )
from fastapi import APIRouter, Depends, HTTPException, Body, Query, Path, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from app.models.recommendation import RecommendationEngine
from app.utils.db_connector import mongo_client
from bson import ObjectId

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize recommendation engine
recommendation_engine = RecommendationEngine()

class ProductRecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    product_id: Optional[str] = None
    category_id: Optional[str] = None
    keywords: Optional[List[str]] = None
    limit: int = Field(10, ge=1, le=50)
    include_viewed: bool = False

class ProductRecommendationResponse(BaseModel):
    products: List[Dict[str, Any]]
    recommendation_type: str
    timestamp: datetime

@router.post("/products", response_model=ProductRecommendationResponse)
async def recommend_products(request: ProductRecommendationRequest = Body(...)):
    """
    Get product recommendations based on various parameters
    """
    try:
        start_time = datetime.utcnow()
        
        # Determine recommendation type based on input
        if request.user_id:
            # Personalized recommendations based on user history
            recommendations = await recommendation_engine.get_personalized_recommendations(
                request.user_id,
                limit=request.limit,
                include_viewed=request.include_viewed
            )
            recommendation_type = "personalized"
            
        elif request.product_id:
            # Similar product recommendations
            recommendations = await recommendation_engine.get_similar_products(
                request.product_id,
                limit=request.limit
            )
            recommendation_type = "similar"
            
        elif request.category_id:
            # Category-based recommendations
            recommendations = await recommendation_engine.get_category_recommendations(
                request.category_id,
                limit=request.limit
            )
            recommendation_type = "category"
            
        elif request.keywords:
            # Keyword-based recommendations
            recommendations = await recommendation_engine.get_keyword_recommendations(
                request.keywords,
                limit=request.limit
            )
            recommendation_type = "keyword"
            
        else:
            # Fallback to popular products
            recommendations = await recommendation_engine.get_popular_products(limit=request.limit)
            recommendation_type = "popular"
        
        # Log recommendation request
        if request.user_id:
            log_data = {
                "userId": ObjectId(request.user_id),
                "recommendationType": recommendation_type,
                "parameters": {
                    "productId": request.product_id,
                    "categoryId": request.category_id,
                    "keywords": request.keywords,
                    "limit": request.limit,
                    "includeViewed": request.include_viewed
                },
                "resultCount": len(recommendations),
                "createdAt": datetime.utcnow()
            }
            await mongo_client.insert_one("recommendationLogs", log_data)
        
        return {
            "products": recommendations,
            "recommendation_type": recommendation_type,
            "timestamp": datetime.utcnow()
        }
    
    except Exception as e:
        logger.error(f"Error generating product recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate product recommendations: {str(e)}"
        )

@router.get("/products/popular", response_model=ProductRecommendationResponse)
async def get_popular_products(limit: int = Query(10, ge=1, le=50)):
    """
    Get popular products
    """
    try:
        recommendations = await recommendation_engine.get_popular_products(limit=limit)
        
        return {
            "products": recommendations,
            "recommendation_type": "popular",
            "timestamp": datetime.utcnow()
        }
    
    except Exception as e:
        logger.error(f"Error getting popular products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get popular products: {str(e)}"
        )

@router.get("/products/similar/{product_id}", response_model=ProductRecommendationResponse)
async def get_similar_products(
    product_id: str = Path(...),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get similar products to a given product
    """
    try:
        recommendations = await recommendation_engine.get_similar_products(
            product_id,
            limit=limit
        )
        
        return {
            "products": recommendations,
            "recommendation_type": "similar",
            "timestamp": datetime.utcnow()
        }
    
    except Exception as e:
        logger.error(f"Error getting similar products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get similar products: {str(e)}"
        )

@router.get("/products/personalized/{user_id}", response_model=ProductRecommendationResponse)
async def get_personalized_recommendations(
    user_id: str = Path(...),
    limit: int = Query(10, ge=1, le=50),
    include_viewed: bool = Query(False)
):
    """
    Get personalized product recommendations for a user
    """
    try:
        recommendations = await recommendation_engine.get_personalized_recommendations(
            user_id,
            limit=limit,
            include_viewed=include_viewed
        )
        
        # Log recommendation request
        log_data = {
            "userId": ObjectId(user_id),
            "recommendationType": "personalized",
            "parameters": {
                "limit": limit,
                "includeViewed": include_viewed
            },
            "resultCount": len(recommendations),
            "createdAt": datetime.utcnow()
        }
        await mongo_client.insert_one("recommendationLogs", log_data)
        
        return {
            "products": recommendations,
            "recommendation_type": "personalized",
            "timestamp": datetime.utcnow()
        }
    
    except Exception as e:
        logger.error(f"Error getting personalized recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get personalized recommendations: {str(e)}"
        )

@router.post("/feedback")
async def record_recommendation_feedback(
    user_id: str = Body(...),
    product_id: str = Body(...),
    recommendation_type: str = Body(...),
    action: str = Body(...),  # clicked, added_to_cart, purchased, ignored
    timestamp: Optional[datetime] = Body(None)
):
    """
    Record user feedback on recommendations for improving the recommendation engine
    """
    try:
        # Verify user exists
        user = await mongo_client.find_one("users", {"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify product exists
        product = await mongo_client.find_one("products", {"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Record feedback
        feedback_data = {
            "userId": ObjectId(user_id),
            "productId": ObjectId(product_id),
            "recommendationType": recommendation_type,
            "action": action,
            "createdAt": timestamp or datetime.utcnow()
        }
        
        await mongo_client.insert_one("recommendationFeedback", feedback_data)
        
        return {
            "success": True,
            "message": "Feedback recorded successfully"
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error recording recommendation feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record recommendation feedback: {str(e)}"
        )

@router.post("/update-embeddings")
async def update_product_embeddings():
    """
    Trigger an update of product embeddings for recommendation engine
    """
    try:
        # Update all product embeddings
        updated_count = await recommendation_engine.update_all_product_embeddings()
        
        return {
            "success": True,
            "message": f"Successfully updated embeddings for {updated_count} products"
        }
    
    except Exception as e:
        logger.error(f"Error updating product embeddings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update product embeddings: {str(e)}"
        )

@router.post("/update-user-embeddings/{user_id}")
async def update_user_embeddings(user_id: str = Path(...)):
    """
    Trigger an update of user embeddings for personalized recommendations
    """
    try:
        # Verify user exists
        user = await mongo_client.find_one("users", {"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user embeddings
        success = await recommendation_engine.update_user_embedding(user_id)
        
        if success:
            return {
                "success": True,
                "message": f"Successfully updated embeddings for user {user_id}"
            }
        else:
            return {
                "success": False,
                "message": f"Failed to update embeddings for user {user_id} due to insufficient data"
            }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating user embeddings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user embeddings: {str(e)}"
        )
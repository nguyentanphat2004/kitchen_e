from fastapi import APIRouter, Depends, HTTPException, Body, Query, Path, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timedelta
from app.utils.db_connector import mongo_client
from bson import ObjectId
import pandas as pd
import numpy as np
from fastapi.responses import JSONResponse
import json

logger = logging.getLogger(__name__)
router = APIRouter()

class UserActivityLog(BaseModel):
    user_id: str
    session_id: str
    activity_type: str  # product_view, search, add_to_cart, purchase, recipe_view, etc.
    data: Dict[str, Any]
    timestamp: Optional[datetime] = None

class UserBehaviorInsight(BaseModel):
    user_id: str
    insights: Dict[str, Any]
    generated_at: datetime

@router.post("/log-activity")
async def log_user_activity(activity: UserActivityLog = Body(...)):
    """
    Log user activity for behavior analysis
    """
    try:
        # Prepare log data
        log_data = {
            "userId": ObjectId(activity.user_id) if activity.user_id else None,
            "sessionId": activity.session_id,
            "activityType": activity.activity_type,
            "data": activity.data,
            "timestamp": activity.timestamp or datetime.utcnow(),
            "createdAt": datetime.utcnow()
        }
        
        # Insert into MongoDB
        await mongo_client.insert_one("userActivityLogs", log_data)
        
        return {
            "success": True,
            "message": "Activity logged successfully"
        }
    
    except Exception as e:
        logger.error(f"Error logging user activity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log user activity: {str(e)}"
        )

@router.get("/insights/{user_id}")
async def get_user_insights(
    user_id: str = Path(...),
    refresh: bool = Query(False)
):
    """
    Get behavioral insights for a specific user
    """
    try:
        # Check if insights already exist and are recent
        existing_insights = None
        
        if not refresh:
            existing_insights = await mongo_client.find_one(
                "userBehaviorInsights",
                {"userId": ObjectId(user_id)},
                sort=[("generatedAt", -1)]
            )
            
            # If insights exist and are less than a day old, return them
            if existing_insights and existing_insights["generatedAt"] > datetime.utcnow() - timedelta(days=1):
                return format_insights(existing_insights)
        
        # Generate new insights
        insights = await generate_user_insights(user_id)
        
        if not insights:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Not enough data to generate insights for this user"}
            )
            
        # Store insights
        insight_data = {
            "userId": ObjectId(user_id),
            "insights": insights,
            "generatedAt": datetime.utcnow()
        }
        
        await mongo_client.insert_one("userBehaviorInsights", insight_data)
        
        return format_insights(insight_data)
    
    except Exception as e:
        logger.error(f"Error getting user insights: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user insights: {str(e)}"
        )

@router.get("/segments")
async def get_user_segments(
    min_users_per_segment: int = Query(5, ge=1),
    max_segments: int = Query(10, ge=1, le=20)
):
    """
    Get user segments based on behavioral patterns
    """
    try:
        # Generate segments
        segments = await generate_user_segments(min_users_per_segment, max_segments)
        
        if not segments:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Not enough data to generate user segments"}
            )
            
        return {
            "segments": segments,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error getting user segments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user segments: {str(e)}"
        )

@router.get("/popular-products")
async def get_popular_products(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get popular products based on user behavior
    """
    try:
        # Calculate date threshold
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        # Aggregate product views
        product_views = await mongo_client.aggregate(
            "userActivityLogs",
            [
                {
                    "$match": {
                        "activityType": "product_view",
                        "timestamp": {"$gte": threshold_date}
                    }
                },
                {
                    "$group": {
                        "_id": "$data.productId",
                        "viewCount": {"$sum": 1},
                        "uniqueUsers": {"$addToSet": "$userId"}
                    }
                },
                {
                    "$addFields": {
                        "uniqueUserCount": {"$size": "$uniqueUsers"}
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "viewCount": 1,
                        "uniqueUserCount": 1
                    }
                },
                {"$sort": {"uniqueUserCount": -1, "viewCount": -1}},
                {"$limit": limit}
            ]
        )
        
        # Get cart additions
        cart_additions = await mongo_client.aggregate(
            "userActivityLogs",
            [
                {
                    "$match": {
                        "activityType": "add_to_cart",
                        "timestamp": {"$gte": threshold_date}
                    }
                },
                {
                    "$group": {
                        "_id": "$data.productId",
                        "cartCount": {"$sum": 1}
                    }
                }
            ]
        )
        
        # Create cart count map
        cart_count_map = {str(item["_id"]): item["cartCount"] for item in cart_additions}
        
        # Get purchases
        purchases = await mongo_client.aggregate(
            "userActivityLogs",
            [
                {
                    "$match": {
                        "activityType": "purchase",
                        "timestamp": {"$gte": threshold_date}
                    }
                },
                {
                    "$unwind": "$data.products"
                },
                {
                    "$group": {
                        "_id": "$data.products.productId",
                        "purchaseCount": {"$sum": 1}
                    }
                }
            ]
        )
        
        # Create purchase count map
        purchase_count_map = {str(item["_id"]): item["purchaseCount"] for item in purchases}
        
        # Get product details and combine metrics
        popular_products = []
        
        for view in product_views:
            product_id = str(view["_id"])
            
            # Get product details
            product = await mongo_client.find_one(
                "products",
                {"_id": ObjectId(product_id)}
            )
            
            if product:
                popular_products.append({
                    "id": product_id,
                    "name": product.get("name", ""),
                    "image": product.get("images", [])[0] if product.get("images") else None,
                    "price": product.get("basePrice", 0),
                    "viewCount": view["viewCount"],
                    "uniqueViewers": view["uniqueUserCount"],
                    "cartAdditions": cart_count_map.get(product_id, 0),
                    "purchases": purchase_count_map.get(product_id, 0),
                    "conversionRate": calculate_conversion_rate(
                        view["viewCount"], 
                        purchase_count_map.get(product_id, 0)
                    )
                })
        
        return {
            "popular_products": popular_products,
            "days_analyzed": days,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error getting popular products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get popular products: {str(e)}"
        )

@router.get("/product-affinity/{product_id}")
async def get_product_affinity(
    product_id: str = Path(...),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get products that are frequently viewed/purchased together with a specific product
    """
    try:
        # Calculate date threshold
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        # Find sessions where this product was viewed
        sessions_with_product = await mongo_client.find_many(
            "userActivityLogs",
            {
                "activityType": "product_view",
                "data.productId": product_id,
                "timestamp": {"$gte": threshold_date}
            },
            projection={"sessionId": 1}
        )
        
        session_ids = [log["sessionId"] for log in sessions_with_product]
        
        if not session_ids:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "No session data found for this product"}
            )
            
        # Find other products viewed in these sessions
        other_product_views = await mongo_client.find_many(
            "userActivityLogs",
            {
                "activityType": "product_view",
                "sessionId": {"$in": session_ids},
                "data.productId": {"$ne": product_id},
                "timestamp": {"$gte": threshold_date}
            },
            projection={"data.productId": 1, "sessionId": 1}
        )
        
        # Count co-occurrences
        product_counts = {}
        for view in other_product_views:
            viewed_product_id = view["data"]["productId"]
            product_counts[viewed_product_id] = product_counts.get(viewed_product_id, 0) + 1
        
        # Sort by co-occurrence count
        related_products = sorted(
            product_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        # Get product details
        affinity_products = []
        for related_id, count in related_products:
            product = await mongo_client.find_one(
                "products",
                {"_id": ObjectId(related_id)}
            )
            
            if product:
                affinity_products.append({
                    "id": str(product["_id"]),
                    "name": product.get("name", ""),
                    "image": product.get("images", [])[0] if product.get("images") else None,
                    "price": product.get("basePrice", 0),
                    "co_view_count": count,
                    "affinity_score": count / len(session_ids)  # Normalized score
                })
        
        return {
            "product_id": product_id,
            "affinity_products": affinity_products,
            "days_analyzed": days,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error getting product affinity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get product affinity: {str(e)}"
        )

@router.get("/search-trends")
async def get_search_trends(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get trending search terms based on user behavior
    """
    try:
        # Calculate date threshold
        threshold_date = datetime.utcnow() - timedelta(days=days)
        
        # Aggregate search logs
        search_logs = await mongo_client.find_many(
            "userActivityLogs",
            {
                "activityType": "search",
                "timestamp": {"$gte": threshold_date}
            },
            projection={"data.query": 1, "timestamp": 1, "userId": 1}
        )
        
        if not search_logs:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "No search data found for the specified time period"}
            )
            
        # Process search terms
        search_terms = {}
        user_term_counts = {}  # Track unique users per term
        
        for log in search_logs:
            query = log["data"]["query"].lower().strip()
            user_id = str(log.get("userId", "anonymous"))
            
            if query:
                # Count total occurrences
                search_terms[query] = search_terms.get(query, 0) + 1
                
                # Track unique users
                if query not in user_term_counts:
                    user_term_counts[query] = set()
                user_term_counts[query].add(user_id)
        
        # Calculate trends
        trends = []
        for term, count in search_terms.items():
            unique_users = len(user_term_counts[term])
            
            trends.append({
                "term": term,
                "count": count,
                "unique_users": unique_users,
                "avg_searches_per_user": count / unique_users if unique_users > 0 else 0
            })
        
        # Sort by count
        trends.sort(key=lambda x: x["count"], reverse=True)
        
        return {
            "search_trends": trends[:limit],
            "days_analyzed": days,
            "total_searches": len(search_logs),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error getting search trends: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get search trends: {str(e)}"
        )

# Helper functions

async def generate_user_insights(user_id: str) -> Dict[str, Any]:
    """Generate behavioral insights for a user"""
    # Get user's activity logs
    logs = await mongo_client.find_many(
        "userActivityLogs",
        {"userId": ObjectId(user_id)},
        sort=[("timestamp", -1)]
    )
    
    if not logs:
        return None
    
    # Process activity logs
    activity_counts = {}
    product_views = []
    searches = []
    purchases = []
    
    for log in logs:
        activity_type = log["activityType"]
        
        # Count activity types
        activity_counts[activity_type] = activity_counts.get(activity_type, 0) + 1
        
        # Track product views
        if activity_type == "product_view":
            product_views.append({
                "productId": log["data"]["productId"],
                "timestamp": log["timestamp"]
            })
        
        # Track searches
        elif activity_type == "search":
            searches.append({
                "query": log["data"]["query"],
                "timestamp": log["timestamp"]
            })
        
        # Track purchases
        elif activity_type == "purchase":
            purchases.append({
                "orderId": log["data"].get("orderId"),
                "products": log["data"].get("products", []),
                "totalAmount": log["data"].get("totalAmount"),
                "timestamp": log["timestamp"]
            })
    
    # Calculate metrics
    insights = {
        "activity_summary": {
            "total_activities": len(logs),
            "activity_breakdown": activity_counts,
            "first_activity": logs[-1]["timestamp"].isoformat(),
            "last_activity": logs[0]["timestamp"].isoformat()
        }
    }
    
    # Product preferences
    if product_views:
        product_counts = {}
        for view in product_views:
            product_counts[view["productId"]] = product_counts.get(view["productId"], 0) + 1
        
        # Get top viewed product details
        top_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        preferred_products = []
        for prod_id, count in top_products:
            product = await mongo_client.find_one(
                "products",
                {"_id": ObjectId(prod_id)}
            )
            
            if product:
                category_id = product.get("categoryId")
                category_name = ""
                
                if category_id:
                    category = await mongo_client.find_one(
                        "categories",
                        {"_id": category_id}
                    )
                    if category:
                        category_name = category.get("name", "")
                
                preferred_products.append({
                    "id": prod_id,
                    "name": product.get("name", ""),
                    "view_count": count,
                    "category": category_name
                })
        
        insights["product_preferences"] = {
            "top_viewed_products": preferred_products,
            "total_unique_products_viewed": len(product_counts)
        }
        
        # Category preferences
        category_counts = {}
        
        for prod_id, count in product_counts.items():
            product = await mongo_client.find_one(
                "products",
                {"_id": ObjectId(prod_id)}
            )
            
            if product and product.get("categoryId"):
                category_id = str(product["categoryId"])
                category_counts[category_id] = category_counts.get(category_id, 0) + count
        
        top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        preferred_categories = []
        for cat_id, count in top_categories:
            category = await mongo_client.find_one(
                "categories",
                {"_id": ObjectId(cat_id)}
            )
            
            if category:
                preferred_categories.append({
                    "id": cat_id,
                    "name": category.get("name", ""),
                    "view_count": count
                })
        
        insights["category_preferences"] = preferred_categories
    
    # Search behavior
    if searches:
        search_terms = [search["query"].lower() for search in searches]
        term_counts = {}
        
        for term in search_terms:
            term_counts[term] = term_counts.get(term, 0) + 1
        
        top_search_terms = sorted(term_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        insights["search_behavior"] = {
            "total_searches": len(searches),
            "unique_search_terms": len(term_counts),
            "top_search_terms": [{"term": term, "count": count} for term, count in top_search_terms]
        }
    
    # Purchase behavior
    if purchases:
        total_spend = sum(purchase.get("totalAmount", 0) for purchase in purchases)
        purchased_products = []
        
        for purchase in purchases:
            products = purchase.get("products", [])
            purchased_products.extend([prod["productId"] for prod in products])
        
        # Count products
        product_counts = {}
        for prod_id in purchased_products:
            product_counts[prod_id] = product_counts.get(prod_id, 0) + 1
        
        # Get top purchased product details
        top_purchased = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        favorite_products = []
        for prod_id, count in top_purchased:
            product = await mongo_client.find_one(
                "products",
                {"_id": ObjectId(prod_id)}
            )
            
            if product:
                favorite_products.append({
                    "id": prod_id,
                    "name": product.get("name", ""),
                    "purchase_count": count
                })
        
        insights["purchase_behavior"] = {
            "total_purchases": len(purchases),
            "total_spend": total_spend,
            "average_order_value": total_spend / len(purchases) if purchases else 0,
            "last_purchase_date": purchases[0]["timestamp"].isoformat() if purchases else None,
            "favorite_products": favorite_products
        }
    
    # Calculate browse-to-buy ratio
    if product_views and purchases:
        unique_products_viewed = len(set(view["productId"] for view in product_views))
        unique_products_bought = len(set(purchased_products)) if 'purchased_products' in locals() else 0
        
        insights["conversion_metrics"] = {
            "browse_to_buy_ratio": unique_products_bought / unique_products_viewed if unique_products_viewed > 0 else 0,
            "unique_products_viewed": unique_products_viewed,
            "unique_products_bought": unique_products_bought
        }
    
    return insights

async def generate_user_segments(min_users_per_segment: int = 5, max_segments: int = 10) -> List[Dict[str, Any]]:
    """Generate user segments based on behavioral patterns"""
    # Get user activity summaries
    user_summaries = await mongo_client.aggregate(
        "userActivityLogs",
        [
            {
                "$match": {
                    "userId": {"$exists": True, "$ne": None}
                }
            },
            {
                "$group": {
                    "_id": "$userId",
                    "total_activities": {"$sum": 1},
                    "activity_types": {"$addToSet": "$activityType"},
                    "first_activity": {"$min": "$timestamp"},
                    "last_activity": {"$max": "$timestamp"}
                }
            },
            {
                "$project": {
                    "userId": "$_id",
                    "total_activities": 1,
                    "activity_types": 1,
                    "activity_type_count": {"$size": "$activity_types"},
                    "days_active": {
                        "$divide": [
                            {"$subtract": ["$last_activity", "$first_activity"]},
                            86400000  # ms in a day
                        ]
                    },
                    "is_recent": {
                        "$gte": [
                            "$last_activity",
                            {"$subtract": [datetime.utcnow(), timedelta(days=30)]}
                        ]
                    }
                }
            }
        ]
    )
    
    if not user_summaries:
        return None
    
    # Get purchase data
    purchase_data = await mongo_client.aggregate(
        "userActivityLogs",
        [
            {
                "$match": {
                    "userId": {"$exists": True, "$ne": None},
                    "activityType": "purchase"
                }
            },
            {
                "$group": {
                    "_id": "$userId",
                    "purchase_count": {"$sum": 1},
                    "total_spent": {"$sum": "$data.totalAmount"}
                }
            }
        ]
    )
    
    # Create purchase map
    purchase_map = {str(item["_id"]): {
        "purchase_count": item["purchase_count"],
        "total_spent": item["total_spent"],
        "avg_order_value": item["total_spent"] / item["purchase_count"] if item["purchase_count"] > 0 else 0
    } for item in purchase_data}
    
    # Process user data for segmentation
    user_data = []
    
    for summary in user_summaries:
        user_id = str(summary["userId"])
        
        # Basic metrics
        user_metrics = {
            "user_id": user_id,
            "total_activities": summary["total_activities"],
            "activity_type_count": summary["activity_type_count"],
            "days_active": summary["days_active"],
            "is_recent": summary["is_recent"],
            "purchase_count": 0,
            "total_spent": 0,
            "avg_order_value": 0
        }
        
        # Add purchase metrics
        if user_id in purchase_map:
            user_metrics.update(purchase_map[user_id])
        
        user_data.append(user_metrics)
    
    # Perform simple segmentation
    segments = []
    
    # High-value customers
    high_value = [
        user for user in user_data 
        if user["purchase_count"] >= 3 and user["avg_order_value"] > 500000  # Assuming VND
    ]
    
    if len(high_value) >= min_users_per_segment:
        segments.append({
            "id": "high_value",
            "name": "Khách hàng cao cấp",
            "description": "Khách hàng mua sắm thường xuyên với giá trị đơn hàng cao",
            "user_count": len(high_value),
            "user_ids": [user["user_id"] for user in high_value],
            "avg_metrics": calculate_average_metrics(high_value)
        })
    
    # Recent new customers
    new_customers = [
        user for user in user_data
        if user["days_active"] <= 30 and user["is_recent"] and user["purchase_count"] > 0
    ]
    
    if len(new_customers) >= min_users_per_segment:
        segments.append({
            "id": "new_customers",
            "name": "Khách hàng mới",
            "description": "Khách hàng đã mua sắm lần đầu trong 30 ngày qua",
            "user_count": len(new_customers),
            "user_ids": [user["user_id"] for user in new_customers],
            "avg_metrics": calculate_average_metrics(new_customers)
        })
    
    # At-risk customers
    at_risk = [
        user for user in user_data
        if not user["is_recent"] and user["purchase_count"] > 0 and user["days_active"] > 60
    ]
    
    if len(at_risk) >= min_users_per_segment:
        segments.append({
            "id": "at_risk",
            "name": "Khách hàng có nguy cơ mất",
            "description": "Khách hàng đã từng mua sắm nhưng không hoạt động trong 30 ngày qua",
            "user_count": len(at_risk),
            "user_ids": [user["user_id"] for user in at_risk],
            "avg_metrics": calculate_average_metrics(at_risk)
        })
    
    # Loyal customers
    loyal = [
        user for user in user_data
        if user["purchase_count"] >= 5 and user["is_recent"]
    ]
    
    if len(loyal) >= min_users_per_segment:
        segments.append({
            "id": "loyal",
            "name": "Khách hàng trung thành",
            "description": "Khách hàng mua sắm thường xuyên và gần đây",
            "user_count": len(loyal),
            "user_ids": [user["user_id"] for user in loyal],
            "avg_metrics": calculate_average_metrics(loyal)
        })
    
    # Browsers (active but no purchase)
    browsers = [
        user for user in user_data
        if user["purchase_count"] == 0 and user["is_recent"] and user["total_activities"] > 10
    ]
    
    if len(browsers) >= min_users_per_segment:
        segments.append({
            "id": "browsers",
            "name": "Người duyệt không mua",
            "description": "Người dùng đang tích cực nhưng chưa thực hiện mua hàng",
            "user_count": len(browsers),
            "user_ids": [user["user_id"] for user in browsers],
            "avg_metrics": calculate_average_metrics(browsers)
        })
    
    # Limit to max_segments
    return segments[:max_segments]

def calculate_average_metrics(users: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate average metrics for a user segment"""
    if not users:
        return {}
    
    avg_metrics = {
        "avg_activities": sum(user["total_activities"] for user in users) / len(users),
        "avg_purchase_count": sum(user["purchase_count"] for user in users) / len(users),
        "avg_order_value": 0,
        "avg_days_active": sum(user["days_active"] for user in users) / len(users)
    }
    
    # Calculate average order value for users who have made purchases
    purchasers = [user for user in users if user["purchase_count"] > 0]
    
    if purchasers:
        avg_metrics["avg_order_value"] = sum(user["avg_order_value"] for user in purchasers) / len(purchasers)
    
    return avg_metrics

def calculate_conversion_rate(views: int, purchases: int) -> float:
    """Calculate conversion rate"""
    if views == 0:
        return 0
    
    return purchases / views

def format_insights(insight_data: Dict[str, Any]) -> Dict[str, Any]:
    """Format insight data for API response"""
    return {
        "user_id": str(insight_data["userId"]),
        "insights": insight_data["insights"],
        "generated_at": insight_data["generatedAt"].isoformat()
    }
import logging
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
import os
import json
import re
from typing import List, Dict, Any, Optional, Union
import aiohttp
import asyncio
from app.config import settings
from app.utils.db_connector import mongo_client
from bson import ObjectId
import time
from datetime import datetime

logger = logging.getLogger(__name__)

class ChatModel:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChatModel, cls).__new__(cls)
            cls._instance.initialized = False
            cls._instance.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        return cls._instance
    
    async def initialize(self):
        """Initialize the chat model"""
        if self.initialized:
            return
            
        try:
            # Load PhoBERT for Vietnamese
            self.tokenizer = AutoTokenizer.from_pretrained(
                settings.PHOBERT_MODEL_PATH,
                use_auth_token=settings.HUGGINGFACE_API_KEY
            )
            
            self.model = AutoModel.from_pretrained(
                settings.PHOBERT_MODEL_PATH,
                use_auth_token=settings.HUGGINGFACE_API_KEY
            ).to(self.device)
            
            # Load intent patterns
            self.intent_patterns = await self._load_intent_patterns()
            
            # Load product catalog for quick reference
            self.product_catalog = await self._load_product_catalog()
            
            # Load common responses
            self.responses = await self._load_responses()
            
            self.initialized = True
            logger.info("Chat model initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize chat model: {str(e)}")
            raise
    
    async def _load_intent_patterns(self) -> Dict[str, List[str]]:
        """Load intent recognition patterns"""
        # In production, this would load from a database or file
        # For this example, we'll define some basic patterns
        patterns = {
            "greeting": [
                r"xin\s+chào",
                r"chào\s+bạn",
                r"hello",
                r"hi",
                r"^chào$",
                r"^hey$"
            ],
            "product_inquiry": [
                r"sản\s+phẩm",
                r"đồ\s+bếp",
                r"nồi",
                r"chảo",
                r"dao",
                r"dụng\s+cụ",
                r"máy\s+xay",
                r"giá\s+bao\s+nhiêu",
                r"mấy\s+tiền",
                r"bán\s+không",
                r"còn\s+hàng\s+không"
            ],
            "order_status": [
                r"đơn\s+hàng",
                r"tình\s+trạng",
                r"vận\s+chuyển",
                r"giao\s+hàng",
                r"theo\s+dõi",
                r"mã\s+đơn",
                r"hủy\s+đơn"
            ],
            "cooking_tips": [
                r"cách\s+nấu",
                r"công\s+thức",
                r"làm\s+thế\s+nào",
                r"làm\s+sao\s+để",
                r"mẹo\s+nấu",
                r"hướng\s+dẫn\s+nấu"
            ],
            "product_recommendation": [
                r"gợi\s+ý",
                r"khuyên",
                r"nên\s+mua",
                r"phù\s+hợp",
                r"tốt\s+nhất",
                r"phổ\s+biến"
            ]
        }
        return patterns
    
    async def _load_product_catalog(self) -> Dict[str, Dict[str, Any]]:
        """Load product catalog for quick reference during conversations"""
        # In production, this would query the database
        # For now, we'll create a small sample
        products = await mongo_client.find_many(
            "products",
            {"isDeleted": {"$ne": True}},
            projection={"name": 1, "description": 1, "basePrice": 1, "images": 1, "categoryId": 1}
        )
        
        # Format product catalog for quick reference
        catalog = {}
        for product in products:
            prod_id = str(product["_id"])
            catalog[prod_id] = {
                "name": product["name"],
                "description": product.get("description", ""),
                "price": product.get("basePrice", 0),
                "image": product.get("images", [])[0] if product.get("images") else None,
                "category_id": str(product.get("categoryId")) if product.get("categoryId") else None
            }
        
        return catalog
    
    async def _load_responses(self) -> Dict[str, List[str]]:
        """Load predefined responses for common intents"""
        # In production, this would load from a database
        responses = {
            "greeting": [
                "Xin chào! Tôi là trợ lý ảo của cửa hàng dụng cụ bếp. Tôi có thể giúp gì cho bạn?",
                "Chào bạn! Rất vui được gặp bạn. Bạn cần tìm dụng cụ bếp gì?",
                "Xin chào! Bạn đang tìm kiếm sản phẩm nào cho căn bếp của mình?"
            ],
            "unknown": [
                "Xin lỗi, tôi không hiểu ý bạn. Bạn có thể nói rõ hơn được không?",
                "Tôi chưa hiểu rõ yêu cầu của bạn. Bạn có thể diễn đạt theo cách khác được không?",
                "Xin lỗi, tôi không chắc là hiểu đúng ý bạn. Bạn đang hỏi về sản phẩm nào?"
            ],
            "product_not_found": [
                "Xin lỗi, tôi không tìm thấy sản phẩm bạn đang tìm. Bạn có thể mô tả rõ hơn không?",
                "Hiện tại chúng tôi không có sản phẩm này. Bạn có muốn xem các sản phẩm tương tự không?"
            ],
            "order_status_query": [
                "Để kiểm tra tình trạng đơn hàng, bạn cần cung cấp mã đơn hàng của bạn.",
                "Bạn vui lòng cho tôi biết mã đơn hàng để tôi kiểm tra tình trạng giúp bạn."
            ]
        }
        return responses
    
    async def detect_intent(self, text: str) -> str:
        """Detect the intent of a user message"""
        # Ensure model is initialized
        await self.initialize()
        
        # Normalize text for pattern matching
        normalized_text = text.lower().strip()
        
        # Check each intent pattern
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, normalized_text):
                    return intent
        
        # Default to general if no match found
        return "general"
    
    async def encode_text(self, text: str) -> np.ndarray:
        """Encode text using PhoBERT model"""
        # Ensure model is initialized
        await self.initialize()
        
        # Tokenize and encode
        inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model(**inputs)
        
        # Use [CLS] token embedding as sentence representation
        sentence_embedding = outputs.last_hidden_state[:, 0, :].cpu().numpy()
        return sentence_embedding[0]  # Return the first (and only) embedding
    
    async def get_product_recommendations(self, query: str, user_id: Optional[str] = None, limit: int = 3) -> List[Dict[str, Any]]:
        """Get product recommendations based on query and optionally user history"""
        # This would be more sophisticated in production
        # For now, we'll do simple keyword matching
        
        query_lower = query.lower()
        matching_products = []
        
        for prod_id, product in self.product_catalog.items():
            name = product["name"].lower()
            description = product["description"].lower()
            
            # Simple keyword matching
            if any(keyword in name or keyword in description for keyword in query_lower.split()):
                matching_products.append({
                    "id": prod_id,
                    "name": product["name"],
                    "price": product["price"],
                    "image": product["image"],
                    "match_score": 1.0  # Simple score for now
                })
        
        # Sort by match score and limit results
        matching_products.sort(key=lambda x: x["match_score"], reverse=True)
        return matching_products[:limit]
    
    async def get_recipe_recommendations(self, product_id: Optional[str] = None, query: Optional[str] = None, limit: int = 3) -> List[Dict[str, Any]]:
        """Get recipe recommendations based on product or query"""
        # Query recipes collection
        query_dict = {}
        
        if product_id:
            # Find recipes linked to this product
            recipe_links = await mongo_client.find_many(
                "recipeProductLinks",
                {"productId": ObjectId(product_id)}
            )
            
            if recipe_links:
                recipe_ids = [link["recipeId"] for link in recipe_links]
                query_dict["_id"] = {"$in": recipe_ids}
        
        if query and not query_dict:
            # Simple text search
            # In production, this would use a text index or more sophisticated matching
            query_lower = query.lower()
            recipes = await mongo_client.find_many("recipes", {})
            
            matching_recipes = []
            for recipe in recipes:
                title = recipe["title"].lower()
                description = recipe.get("description", "").lower()
                
                if query_lower in title or query_lower in description:
                    matching_recipes.append({
                        "id": str(recipe["_id"]),
                        "title": recipe["title"],
                        "description": recipe.get("description", ""),
                        "difficulty": recipe.get("difficulty", "medium"),
                        "preparation_time": recipe.get("preparationTime", 30)
                    })
            
            return matching_recipes[:limit]
        
        if query_dict:
            recipes = await mongo_client.find_many(
                "recipes",
                query_dict,
                limit=limit
            )
            
            return [{
                "id": str(recipe["_id"]),
                "title": recipe["title"],
                "description": recipe.get("description", ""),
                "difficulty": recipe.get("difficulty", "medium"),
                "preparation_time": recipe.get("preparationTime", 30)
            } for recipe in recipes]
        
        # If no specific query, return popular recipes
        recipes = await mongo_client.find_many(
            "recipes",
            {},
            sort=[("popularity", -1)],
            limit=limit
        )
        
        return [{
            "id": str(recipe["_id"]),
            "title": recipe["title"],
            "description": recipe.get("description", ""),
            "difficulty": recipe.get("difficulty", "medium"),
            "preparation_time": recipe.get("preparationTime", 30)
        } for recipe in recipes]
    
    async def generate_response(
        self, 
        text: str, 
        history: List[Dict[str, str]] = [], 
        language: str = "vi",
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a response to user input"""
        # Ensure model is initialized
        await self.initialize()
        
        # Detect intent
        intent_type = await self.detect_intent(text)
        
        # Get basic response based on intent
        response = await self._generate_intent_response(text, intent_type, user_id)
        
        # Add suggested actions based on intent
        suggested_actions = await self._get_suggested_actions(intent_type)
        
        # Add product recommendations if relevant
        suggested_products = []
        if intent_type in ["product_inquiry", "product_recommendation"]:
            suggested_products = await self.get_product_recommendations(text, user_id)
        
        # Add recipe recommendations if relevant
        suggested_recipes = []
        if intent_type in ["cooking_tips"]:
            suggested_recipes = await self.get_recipe_recommendations(query=text)
        
        return {
            "response": response,
            "intent_type": intent_type,
            "suggested_actions": suggested_actions,
            "suggested_products": suggested_products,
            "suggested_recipes": suggested_recipes
        }
    
    async def _generate_intent_response(self, text: str, intent_type: str, user_id: Optional[str] = None) -> str:
        """Generate a response based on detected intent"""
        if intent_type == "greeting":
            # Simple random response for greetings
            return np.random.choice(self.responses["greeting"])
        
        elif intent_type == "product_inquiry":
            # Extract product name or type from query
            # This would use NER in production
            products = await self.get_product_recommendations(text)
            
            if products:
                product = products[0]  # Get the best match
                return f"Chúng tôi có sản phẩm {product['name']} với giá {product['price']} VND. Bạn có muốn biết thêm thông tin không?"
            else:
                return np.random.choice(self.responses["product_not_found"])
        
        elif intent_type == "order_status":
            # Check if query contains order ID
            order_id_match = re.search(r'\b[A-Za-z0-9]{8,}\b', text)
            
            if order_id_match and user_id:
                order_id = order_id_match.group(0)
                # In production, would query the order database
                return f"Đơn hàng {order_id} của bạn đang trong quá trình vận chuyển và dự kiến sẽ đến trong 2-3 ngày tới."
            else:
                return np.random.choice(self.responses["order_status_query"])
        
        elif intent_type == "cooking_tips":
            # Extract dish or ingredient from query
            recipes = await self.get_recipe_recommendations(query=text)
            
            if recipes:
                recipe = recipes[0]  # Get the best match
                return f"Tôi có công thức cho {recipe['title']}. Món này có độ khó {recipe['difficulty']} và thời gian chuẩn bị khoảng {recipe['preparation_time']} phút. Bạn có muốn xem chi tiết không?"
            else:
                return "Xin lỗi, tôi không có công thức phù hợp với yêu cầu của bạn. Bạn có thể mô tả rõ hơn hoặc hỏi về một món khác."
        
        elif intent_type == "product_recommendation":
            products = await self.get_product_recommendations(text, user_id)
            
            if products:
                product_list = ", ".join([p["name"] for p in products[:3]])
                return f"Dựa trên yêu cầu của bạn, tôi gợi ý các sản phẩm sau: {product_list}. Bạn muốn tìm hiểu thêm về sản phẩm nào?"
            else:
                return "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn. Bạn có thể mô tả chi tiết hơn không?"
        
        else:  # general or unknown
            return np.random.choice(self.responses["unknown"])
    
    async def _get_suggested_actions(self, intent_type: str) -> List[Dict[str, str]]:
        """Get suggested actions based on intent type"""
        suggestions = []
        
        if intent_type == "greeting":
            suggestions = [
                {"text": "Xem sản phẩm mới", "action": "view_new_products"},
                {"text": "Tìm công thức nấu ăn", "action": "find_recipes"},
                {"text": "Khuyến mãi hiện tại", "action": "view_promotions"}
            ]
        
        elif intent_type == "product_inquiry":
            suggestions = [
                {"text": "So sánh sản phẩm", "action": "compare_products"},
                {"text": "Xem đánh giá", "action": "view_reviews"},
                {"text": "Thêm vào giỏ hàng", "action": "add_to_cart"}
            ]
        
        elif intent_type == "order_status":
            suggestions = [
                {"text": "Theo dõi đơn hàng", "action": "track_order"},
                {"text": "Liên hệ CSKH", "action": "contact_support"},
                {"text": "Hủy đơn hàng", "action": "cancel_order"}
            ]
        
        elif intent_type == "cooking_tips":
            suggestions = [
                {"text": "Xem video hướng dẫn", "action": "view_recipe_video"},
                {"text": "Mua nguyên liệu", "action": "buy_ingredients"},
                {"text": "Lưu công thức", "action": "save_recipe"}
            ]
        
        elif intent_type == "product_recommendation":
            suggestions = [
                {"text": "Xem chi tiết", "action": "view_product_details"},
                {"text": "So sánh sản phẩm", "action": "compare_products"},
                {"text": "Xem sản phẩm tương tự", "action": "view_similar_products"}
            ]
        
        else:  # general or unknown
            suggestions = [
                {"text": "Xem sản phẩm bán chạy", "action": "view_bestsellers"},
                {"text": "Khuyến mãi", "action": "view_promotions"},
                {"text": "Liên hệ hỗ trợ", "action": "contact_support"}
            ]
        
        return suggestions
    
    async def get_suggestions(
        self, 
        user_id: Optional[str] = None, 
        query: Optional[str] = None,
        limit: int = 5
    ) -> List[str]:
        """Get quick reply suggestions based on user history or current query"""
        suggestions = []
        
        if user_id:
            # Get user's frequent queries
            user_logs = await mongo_client.find_many(
                "aiAssistantLogs",
                {"userId": ObjectId(user_id)},
                sort=[("createdAt", -1)],
                limit=10
            )
            
            # Extract unique queries
            user_queries = list(set([log["query"] for log in user_logs]))
            
            if user_queries:
                suggestions.extend(user_queries[:2])  # Add top 2 user queries
        
        if query:
            # Detect intent from query
            intent_type = await self.detect_intent(query)
            
            # Add common follow-up questions based on intent
            if intent_type == "product_inquiry":
                suggestions.extend([
                    "Sản phẩm này có khuyến mãi không?",
                    "Còn màu nào khác không?",
                    "Có kích thước nào khác không?"
                ])
            
            elif intent_type == "cooking_tips":
                suggestions.extend([
                    "Có công thức nấu món gì dễ không?",
                    "Cần dụng cụ gì để nấu món này?",
                    "Có video hướng dẫn không?"
                ])
            
            elif intent_type == "product_recommendation":
                suggestions.extend([
                    "Sản phẩm nào bán chạy nhất?",
                    "Có sản phẩm nào đang giảm giá không?",
                    "Nên mua combo nào tiết kiệm nhất?"
                ])
        
        # Fill remaining slots with general suggestions
        general_suggestions = [
            "Có sản phẩm mới không?",
            "Chính sách đổi trả như thế nào?",
            "Phí vận chuyển là bao nhiêu?",
            "Thời gian giao hàng mất bao lâu?",
            "Có chương trình khuyến mãi nào không?"
        ]
        
        while len(suggestions) < limit and general_suggestions:
            suggestion = general_suggestions.pop(0)
            if suggestion not in suggestions:
                suggestions.append(suggestion)
        
        return suggestions[:limit]
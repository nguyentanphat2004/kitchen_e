import re
import unicodedata
import numpy as np
from typing import List, Dict, Any, Union, Optional
import pandas as pd

def clean_text(text: str) -> str:
    """
    Clean text by removing special characters, extra whitespace, etc.
    
    Args:
        text: Text to clean
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Normalize unicode characters
    text = unicodedata.normalize('NFKD', text)
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    
    # Remove HTML tags
    text = re.sub(r'<.*?>', '', text)
    
    # Remove special characters and digits
    # text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def tokenize_vietnamese(text: str) -> List[str]:
    """
    Tokenize Vietnamese text
    
    Args:
        text: Text to tokenize
        
    Returns:
        List of tokens
    """
    # In a production environment, this would use a specialized 
    # Vietnamese tokenizer like VnCoreNLP or PyVi
    # For now, we'll use a simple whitespace tokenizer
    return text.split()

def normalize_product_data(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize product data for consistent processing
    
    Args:
        product: Product data dictionary
        
    Returns:
        Normalized product data
    """
    normalized = {}
    
    # Basic product info
    normalized["id"] = str(product.get("_id", ""))
    normalized["name"] = product.get("name", "")
    normalized["description"] = product.get("description", "")
    normalized["price"] = float(product.get("basePrice", 0))
    
    # Category handling
    if "categoryId" in product and product["categoryId"]:
        normalized["category_id"] = str(product["categoryId"])
    else:
        normalized["category_id"] = None
        
    # Image handling
    images = product.get("images", [])
    normalized["image"] = images[0] if images else None
    normalized["image_count"] = len(images)
    
    # Variant handling
    variants = product.get("productVariants", [])
    normalized["variants"] = []
    
    for variant in variants:
        normalized_variant = {
            "id": str(variant.get("_id", "")),
            "color": variant.get("color", ""),
            "size": variant.get("size", ""),
            "material": variant.get("material", ""),
            "price": float(variant.get("price", 0))
        }
        normalized["variants"].append(normalized_variant)
    
    normalized["variant_count"] = len(variants)
    
    # Metadata
    normalized["created_at"] = product.get("createdAt", None)
    normalized["updated_at"] = product.get("updatedAt", None)
    normalized["is_deleted"] = product.get("isDeleted", False)
    normalized["is_customizable"] = product.get("isCustomizable", False)
    
    return normalized

def normalize_user_data(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize user data for consistent processing
    
    Args:
        user: User data dictionary
        
    Returns:
        Normalized user data
    """
    normalized = {}
    
    # Basic user info
    normalized["id"] = str(user.get("_id", ""))
    normalized["username"] = user.get("username", "")
    normalized["email"] = user.get("email", "")
    normalized["role"] = user.get("role", "user")
    
    # Optional personal info
    normalized["full_name"] = user.get("fullName", "")
    normalized["phone"] = user.get("phone", "")
    normalized["avatar"] = user.get("avatar", None)
    
    # Address handling
    addresses = user.get("addresses", [])
    normalized["addresses"] = addresses
    normalized["address_count"] = len(addresses)
    
    # Account status
    normalized["is_active"] = not user.get("isDeleted", False)
    normalized["created_at"] = user.get("createdAt", None)
    normalized["last_login"] = user.get("lastLogin", None)
    
    return normalized

def normalize_order_data(order: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize order data for consistent processing
    
    Args:
        order: Order data dictionary
        
    Returns:
        Normalized order data
    """
    normalized = {}
    
    # Basic order info
    normalized["id"] = str(order.get("_id", ""))
    normalized["user_id"] = str(order.get("userId", ""))
    normalized["status"] = order.get("status", "")
    normalized["total_amount"] = float(order.get("totalAmount", 0))
    
    # Items handling
    items = order.get("items", [])
    normalized["items"] = []
    
    for item in items:
        normalized_item = {
            "product_id": str(item.get("productId", "")),
            "variant_id": str(item.get("variantId", "")) if "variantId" in item else None,
            "quantity": int(item.get("quantity", 0)),
            "price": float(item.get("price", 0)),
            "total": float(item.get("quantity", 0) * item.get("price", 0))
        }
        normalized["items"].append(normalized_item)
    
    normalized["item_count"] = len(items)
    
    # Payment and shipping info
    normalized["payment_method"] = order.get("paymentMethod", "")
    normalized["payment_status"] = order.get("paymentStatus", "")
    normalized["shipping_address"] = order.get("shippingAddress", {})
    normalized["shipping_method"] = order.get("shippingMethod", "")
    normalized["shipping_fee"] = float(order.get("shippingFee", 0))
    
    # Dates
    normalized["created_at"] = order.get("createdAt", None)
    normalized["updated_at"] = order.get("updatedAt", None)
    
    return normalized

def create_numerical_features(data: Dict[str, Any], feature_keys: List[str]) -> np.ndarray:
    """
    Extract numerical features from data dictionary
    
    Args:
        data: Data dictionary
        feature_keys: List of keys to extract
        
    Returns:
        Numpy array of numerical features
    """
    features = []
    
    for key in feature_keys:
        if key in data and data[key] is not None:
            # Handle nested keys with dot notation
            if "." in key:
                parts = key.split(".")
                value = data
                for part in parts:
                    if part in value:
                        value = value[part]
                    else:
                        value = 0
                        break
                features.append(float(value))
            else:
                features.append(float(data[key]))
        else:
            features.append(0.0)
    
    return np.array(features)

def create_categorical_features(data: Dict[str, Any], feature_keys: List[str], one_hot: bool = True) -> Union[np.ndarray, List[str]]:
    """
    Extract categorical features from data dictionary
    
    Args:
        data: Data dictionary
        feature_keys: List of keys to extract
        one_hot: Whether to one-hot encode the features
        
    Returns:
        One-hot encoded numpy array or list of categorical values
    """
    features = []
    
    for key in feature_keys:
        if key in data and data[key] is not None:
            # Handle nested keys with dot notation
            if "." in key:
                parts = key.split(".")
                value = data
                for part in parts:
                    if part in value:
                        value = value[part]
                    else:
                        value = ""
                        break
                features.append(str(value))
            else:
                features.append(str(data[key]))
        else:
            features.append("")
    
    if one_hot:
        # Convert to pandas and one-hot encode
        df = pd.DataFrame([features], columns=feature_keys)
        one_hot_df = pd.get_dummies(df, prefix=feature_keys)
        return one_hot_df.values[0]
    else:
        return features

def normalize_timestamp_features(timestamps: List[Any], reference_time: Optional[Any] = None) -> np.ndarray:
    """
    Normalize timestamp features relative to a reference time
    
    Args:
        timestamps: List of timestamps
        reference_time: Reference time (default: current time)
        
    Returns:
        Numpy array of normalized timestamps (days)
    """
    import datetime
    
    # Convert to datetime objects if needed
    datetimes = []
    for ts in timestamps:
        if isinstance(ts, datetime.datetime):
            datetimes.append(ts)
        elif isinstance(ts, str):
            try:
                datetimes.append(datetime.datetime.fromisoformat(ts))
            except ValueError:
                datetimes.append(None)
        else:
            datetimes.append(None)
    
    # Set reference time if not provided
    if reference_time is None:
        reference_time = datetime.datetime.utcnow()
    elif isinstance(reference_time, str):
        reference_time = datetime.datetime.fromisoformat(reference_time)
    
    # Calculate days difference
    normalized = []
    for dt in datetimes:
        if dt is not None:
            # Calculate days difference
            diff = (reference_time - dt).total_seconds() / (24 * 3600)  # Convert to days
            normalized.append(diff)
        else:
            normalized.append(None)
    
    return np.array(normalized)

def scale_numerical_features(features: np.ndarray, method: str = 'minmax') -> np.ndarray:
    """
    Scale numerical features
    
    Args:
        features: Numerical features array
        method: Scaling method ('minmax' or 'standard')
        
    Returns:
        Scaled features
    """
    if method == 'minmax':
        # Min-max scaling
        min_vals = np.min(features, axis=0)
        max_vals = np.max(features, axis=0)
        
        # Avoid division by zero
        range_vals = max_vals - min_vals
        range_vals[range_vals == 0] = 1
        
        scaled = (features - min_vals) / range_vals
        
    elif method == 'standard':
        # Standard scaling
        mean_vals = np.mean(features, axis=0)
        std_vals = np.std(features, axis=0)
        
        # Avoid division by zero
        std_vals[std_vals == 0] = 1
        
        scaled = (features - mean_vals) / std_vals
        
    else:
        raise ValueError(f"Unknown scaling method: {method}")
    
    return scaled

def impute_missing_values(data: np.ndarray, strategy: str = 'mean') -> np.ndarray:
    """
    Impute missing values in numerical data
    
    Args:
        data: Numerical data array
        strategy: Imputation strategy ('mean', 'median', 'zero')
        
    Returns:
        Imputed data
    """
    # Find missing values
    missing_mask = np.isnan(data)
    
    if not np.any(missing_mask):
        return data
    
    imputed = data.copy()
    
    if strategy == 'mean':
        # Impute with column mean
        col_mean = np.nanmean(data, axis=0)
        
        # Fill missing values
        for i in range(data.shape[1]):
            imputed[:, i][missing_mask[:, i]] = col_mean[i]
            
    elif strategy == 'median':
        # Impute with column median
        col_median = np.nanmedian(data, axis=0)
        
        # Fill missing values
        for i in range(data.shape[1]):
            imputed[:, i][missing_mask[:, i]] = col_median[i]
            
    elif strategy == 'zero':
        # Impute with zeros
        imputed[missing_mask] = 0
        
    else:
        raise ValueError(f"Unknown imputation strategy: {strategy}")
    
    return imputed
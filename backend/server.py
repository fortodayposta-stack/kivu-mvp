from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List
from datetime import datetime

from models import User, UserCreate, UserLogin, UserResponse, Token, Cart, CartItem, Order, OrderCreate, SellerProduct, SellerProductCreate
from auth import get_password_hash, verify_password, create_access_token, get_current_user


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Authentication Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password),
        account_type=user_data.account_type
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        account_type=user.account_type,
        created_at=user.created_at
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = User(**user_doc)
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        account_type=user.account_type,
        created_at=user.created_at
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = User(**user_doc)
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        account_type=user.account_type,
        created_at=user.created_at
    )


# Cart Routes
@api_router.get("/cart")
async def get_cart(user_id: str = Depends(get_current_user)):
    cart_doc = await db.carts.find_one({"user_id": user_id})
    if not cart_doc:
        # Create empty cart
        cart = Cart(user_id=user_id)
        await db.carts.insert_one(cart.dict())
        return cart
    return Cart(**cart_doc)

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, user_id: str = Depends(get_current_user)):
    cart_doc = await db.carts.find_one({"user_id": user_id})
    
    if not cart_doc:
        cart = Cart(user_id=user_id, items=[item.dict()])
        await db.carts.insert_one(cart.dict())
    else:
        cart = Cart(**cart_doc)
        # Check if item already exists
        item_exists = False
        for i, existing_item in enumerate(cart.items):
            if existing_item.get('product_id') == item.product_id and existing_item.get('is_pool_purchase') == item.is_pool_purchase:
                cart.items[i]['quantity'] += item.quantity
                item_exists = True
                break
        
        if not item_exists:
            cart.items.append(item.dict())
        
        cart.updated_at = datetime.utcnow()
        await db.carts.update_one(
            {"user_id": user_id},
            {"$set": cart.dict()}
        )
    
    return {"message": "Item added to cart"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: int, user_id: str = Depends(get_current_user)):
    cart_doc = await db.carts.find_one({"user_id": user_id})
    if not cart_doc:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart = Cart(**cart_doc)
    cart.items = [item for item in cart.items if item.get('product_id') != product_id]
    cart.updated_at = datetime.utcnow()
    
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": cart.dict()}
    )
    
    return {"message": "Item removed from cart"}

@api_router.delete("/cart/clear")
async def clear_cart(user_id: str = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [], "updated_at": datetime.utcnow()}}
    )
    return {"message": "Cart cleared"}


# Order Routes
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, user_id: str = Depends(get_current_user)):
    order = Order(
        user_id=user_id,
        items=[item.dict() for item in order_data.items],
        total_amount=order_data.total_amount
    )
    
    await db.orders.insert_one(order.dict())
    
    # Clear cart after order
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [], "updated_at": datetime.utcnow()}}
    )
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(user_id: str = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user_id}).to_list(1000)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, user_id: str = Depends(get_current_user)):
    order_doc = await db.orders.find_one({"id": order_id, "user_id": user_id})
    if not order_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order_doc)


# Seller Product Routes
@api_router.post("/seller/products", response_model=SellerProduct)
async def create_seller_product(product_data: SellerProductCreate, user_id: str = Depends(get_current_user)):
    # Check if user is a seller
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc or user_doc.get('account_type') != 'seller':
        raise HTTPException(status_code=403, detail="Only sellers can create products")
    
    # --- ИЗМЕНЕНИЕ: Теперь мы передаем ВСЕ поля из product_data ---
    product = SellerProduct(
        seller_id=user_id,
        name=product_data.name,
        nameRw=product_data.nameRw,
        description=product_data.description,
        descriptionRw=product_data.descriptionRw,
        category=product_data.category,
        image=product_data.image,
        images=product_data.images,
        regularPrice=product_data.regularPrice,
        perItemPrice=product_data.perItemPrice,
        poolPrice=product_data.poolPrice,
        poolSize=product_data.poolSize,
        poolCurrent=product_data.poolCurrent,
        rating=product_data.rating
        # Статус по умолчанию 'pending'
    )
    
    await db.seller_products.insert_one(product.dict())
    return product

@api_router.get("/seller/products", response_model=List[SellerProduct])
async def get_seller_products(user_id: str = Depends(get_current_user)):
    products = await db.seller_products.find({"seller_id": user_id}).to_list(1000)
    return [SellerProduct(**product) for product in products]

@api_router.get("/seller/products/all", response_model=List[SellerProduct])
async def get_all_seller_products():
    products = await db.seller_products.find({"status": "approved"}).to_list(1000)
    return [SellerProduct(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=SellerProduct)
async def get_product(product_id: str):
    product_doc = await db.seller_products.find_one({"id": product_id})
    if not product_doc:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Мы не будем проверять статус, чтобы владелец мог видеть его,
    # но в будущем для публичного каталога мы должны проверять:
    # if product_doc.get('status') != 'approved':
    #     raise HTTPException(status_code=403, detail="Product not available")
            
    return SellerProduct(**product_doc)


# --- НОВЫЙ КОД: АДМИН-ЭНДПОИНТЫ ---
async def get_admin_user(user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc or user_doc.get('email') != 'admin@kivu.market':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return user_doc

@api_router.get("/admin/products/all", response_model=List[SellerProduct])
async def admin_get_all_products(admin_user: dict = Depends(get_admin_user)):
    products = await db.seller_products.find().to_list(1000)
    return [SellerProduct(**product) for product in products]

@api_router.get("/admin/products/pending", response_model=List[SellerProduct])
async def admin_get_pending_products(admin_user: dict = Depends(get_admin_user)):
    products = await db.seller_products.find({"status": "pending"}).to_list(1000)
    return [SellerProduct(**product) for product in products]

@api_router.post("/admin/products/approve/{product_id}", response_model=SellerProduct)
async def admin_approve_product(product_id: str, admin_user: dict = Depends(get_admin_user)):
    updated_product = await db.seller_products.find_one_and_update(
        {"id": product_id},
        {"$set": {"status": "approved"}},
        return_document=True
    )
    if not updated_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return SellerProduct(**updated_product)

@api_router.post("/admin/products/reject/{product_id}", response_model=SellerProduct)
async def admin_reject_product(product_id: str, admin_user: dict = Depends(get_admin_user)):
    updated_product = await db.seller_products.find_one_and_update(
        {"id": product_id},
        {"$set": {"status": "rejected"}},
        return_document=True
    )
    if not updated_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return SellerProduct(**updated_product)


# Health check
@api_router.get("/")
async def root():
    return {"message": "KIVU Marketplace API", "status": "active"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
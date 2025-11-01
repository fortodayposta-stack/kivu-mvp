import os
import asyncio
import uuid
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Контекст пароля (скопировано из auth.py) ---
# Мы не можем импортировать из auth.py, так как это скрипт,
# поэтому определяем его здесь.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

# --- Демонстрационные данные (из frontend/src/mock/products.js) ---
mock_products_data = [
  {
    "id": 1, # Это ID из mock-файла, мы его проигнорируем и создадим новый UUID
    "name": "Wireless Headphones",
    "nameRw": "Amatwi Adafite Insinga",
    "description": "High-quality wireless headphones with noise cancellation",
    "descriptionRw": "Amatwi yujuje ubuziranenge adafite insinga hamwe no guhagarika urusaku",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    "regularPrice": 89.99,
    "perItemPrice": 89.99,
    "poolPrice": 64.99,
    "poolSize": 100,
    "poolCurrent": 67,
    "rating": 4.5,
  },
  {
    "id": 2,
    "name": "Smart Watch",
    "nameRw": "Isaha Yubwenge",
    "description": "Feature-packed smartwatch with fitness tracking",
    "descriptionRw": "Isaha yubwenge yuzuye imiterere hamwe no gukurikirana imyitozo",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    "regularPrice": 199.99,
    "perItemPrice": 199.99,
    "poolPrice": 149.99,
    "poolSize": 100,
    "poolCurrent": 43,
    "rating": 4.7,
  },
  {
    "id": 3,
    "name": "Running Shoes",
    "nameRw": "Inkweto zo Kwiruka",
    "description": "Comfortable running shoes for all terrains",
    "descriptionRw": "Inkweto zo kwiruka zifite ubwihangane ku butaka bwose",
    "category": "Sports",
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    "regularPrice": 79.99,
    "perItemPrice": 79.99,
    "poolPrice": 59.99,
    "poolSize": 100,
    "poolCurrent": 82,
    "rating": 4.6,
  },
  {
    "id": 4,
    "name": "Coffee Maker",
    "nameRw": "Icyuma cyo Gukora Ikawa",
    "description": "Automatic coffee maker with timer function",
    "descriptionRw": "Icyuma cyo gukora ikawa gifite igihe cyikora",
    "category": "Home & Garden",
    "image": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500",
    "regularPrice": 129.99,
    "perItemPrice": 129.99,
    "poolPrice": 94.99,
    "poolSize": 100,
    "poolCurrent": 56,
    "rating": 4.4,
  },
  {
    "id": 5,
    "name": "Leather Backpack",
    "nameRw": "Umufuka w\'Uruhu",
    "description": "Premium leather backpack with laptop compartment",
    "descriptionRw": "Umufuka w\'uruhu rwiza ufite icyumba cya mudasobwa",
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    "regularPrice": 149.99,
    "perItemPrice": 149.99,
    "poolPrice": 109.99,
    "poolSize": 100,
    "poolCurrent": 38,
    "rating": 4.8,
  },
  {
    "id": 6,
    "name": "Yoga Mat",
    "nameRw": "Umutego wa Yoga",
    "description": "Non-slip yoga mat with carrying strap",
    "descriptionRw": "Umutego wa yoga utanyerera hamwe n\'umukandara wo kutwara",
    "category": "Sports",
    "image": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
    "regularPrice": 39.99,
    "perItemPrice": 39.99,
    "poolPrice": 27.99,
    "poolSize": 100,
    "poolCurrent": 71,
    "rating": 4.5,
  },
  {
    "id": 7,
    "name": "Desk Lamp",
    "nameRw": "Itara ry\'Ameza",
    "description": "LED desk lamp with adjustable brightness",
    "descriptionRw": "Itara rya LED ry\'ameza rifite urumuri ruhinduka",
    "category": "Home & Garden",
    "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500",
    "regularPrice": 49.99,
    "perItemPrice": 49.99,
    "poolPrice": 34.99,
    "poolSize": 100,
    "poolCurrent": 89,
    "rating": 4.3,
  },
  {
    "id": 8,
    "name": "Bluetooth Speaker",
    "nameRw": "Haut-parleur ya Bluetooth",
    "description": "Portable waterproof Bluetooth speaker",
    "descriptionRw": "Haut-parleur ya Bluetooth itwara amazi",
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
    "regularPrice": 69.99,
    "perItemPrice": 69.99,
    "poolPrice": 49.99,
    "poolSize": 100,
    "poolCurrent": 52,
    "rating": 4.6,
  },
]

async def seed_database():
    """
    Главная асинхронная функция для 'посева' базы данных.
    """
    logger.info("Запуск скрипта 'посева' (seeding)...")
    
    # --- 1. Подключение к MongoDB ---
    try:
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
        mongo_url = os.environ.get('MONGO_URL')
        db_name = os.environ.get('DB_NAME')
        
        if not mongo_url or not db_name:
            logger.error("Ошибка: MONGO_URL или DB_NAME не найдены в .env файле.")
            return

        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        logger.info(f"Успешное подключение к MongoDB (База: {db_name})")
    except Exception as e:
        logger.error(f"Ошибка подключения к MongoDB: {e}")
        return

    # --- 2. Создание или получение Демо-Продавца ---
    try:
        users_collection = db.users
        seller_email = "seller@kivu.market"
        
        seller_user = await users_collection.find_one({"email": seller_email})
        
        if not seller_user:
            logger.info(f"Демо-продавец '{seller_email}' не найден. Создание нового...")
            seller_user_id = str(uuid.uuid4())
            seller_user_doc = {
                "id": seller_user_id,
                "email": seller_email,
                "name": "Kivu Demo Seller",
                "password_hash": get_password_hash("demo123"), # Пароль 'demo123'
                "account_type": "seller",
                # created_at будет добавлено автоматически Pydantic, но здесь мы добавляем вручную
                "created_at": asyncio.get_event_loop().time() 
            }
            await users_collection.insert_one(seller_user_doc)
            logger.info(f"Демо-продавец создан с ID: {seller_user_id}")
            seller_id = seller_user_id
        else:
            logger.info(f"Найден существующий демо-продавец. ID: {seller_user['id']}")
            seller_id = seller_user['id']

    except Exception as e:
        logger.error(f"Ошибка при создании/получении продавца: {e}")
        client.close()
        return

    # --- 3. 'Посев' Товаров ---
    try:
        products_collection = db.seller_products
        
        # Сначала удалим все старые демо-товары от этого продавца
        delete_result = await products_collection.delete_many({"seller_id": seller_id})
        logger.info(f"Удалено {delete_result.deleted_count} старых демо-товаров.")
        
        products_to_insert = []
        for product_data in mock_products_data:
            # Создаем документ, соответствующий модели SellerProduct
            new_product = {
                "id": str(uuid.uuid4()),
                "seller_id": seller_id,
                "name": product_data["name"],
                "nameRw": product_data["nameRw"],
                "description": product_data["description"],
                "descriptionRw": product_data["descriptionRw"],
                "category": product_data["category"],
                "image": product_data["image"],
                "images": [], # В mock-данных нет галереи, оставляем пустым
                "regularPrice": product_data["regularPrice"],
                "perItemPrice": product_data["perItemPrice"],
                "poolPrice": product_data["poolPrice"],
                "poolSize": product_data["poolSize"],
                "poolCurrent": product_data["poolCurrent"],
                "rating": product_data["rating"],
                "status": "approved", # !ВАЖНО: Одобряем сразу для MVP
                "created_at": asyncio.get_event_loop().time()
            }
            products_to_insert.append(new_product)
        
        # Вставляем все новые товары одним запросом
        if products_to_insert:
            insert_result = await products_collection.insert_many(products_to_insert)
            logger.info(f"Успешно 'посеяно' (добавлено) {len(insert_result.inserted_ids)} новых товаров в базу данных.")
        else:
            logger.info("Нет товаров для добавления.")

    except Exception as e:
        logger.error(f"Ошибка при 'посеве' товаров: {e}")
    
    finally:
        client.close()
        logger.info("Подключение к MongoDB закрыто.")

# --- Запуск асинхронной функции ---
if __name__ == "__main__":
    # Убедимся, что все необходимые пакеты установлены
    # (Обычно это делается через 'pip install -r requirements.txt')
    logger.info("Для работы скрипта требуются: motor, python-dotenv, passlib[bcrypt]")
    asyncio.run(seed_database())
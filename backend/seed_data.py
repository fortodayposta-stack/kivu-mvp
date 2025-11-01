import os
import random
import requests
from pymongo import MongoClient
from werkzeug.security import generate_password_hash

# Load MongoDB connection string from .env
MONGODB_URI = os.getenv('MONGODB_URI')

# Categories and sample product images from Unsplash
CATEGORIES = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books']
IMAGE_URLS = [
    'https://source.unsplash.com/300x300/?electronics',
    'https://source.unsplash.com/300x300/?fashion',
    'https://source.unsplash.com/300x300/?home',
    'https://source.unsplash.com/300x300/?sports',
    'https://source.unsplash.com/300x300/?books'
]

# Connect to MongoDB
try:
    client = MongoClient(MONGODB_URI)
    db = client['your_database_name']  # Replace with your actual database name
    users_collection = db['users']
    products_collection = db['products']
    print("Connected to MongoDB")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    exit()

# Create users
def create_user(email, password, role):
    try:
        if users_collection.find_one({"email": email}):
            print(f"User with email {email} already exists.")
            return
        hashed_password = generate_password_hash(password)
        users_collection.insert_one({"email": email, "password": hashed_password, "role": role})
        print(f"{role.capitalize()} user created with email: {email}")
    except Exception as e:
        print(f"Error creating user {email}: {e}")

# Create sample products
def create_products():
    try:
        for _ in range(10):
            category = random.choice(CATEGORIES)
            image_url = random.choice(IMAGE_URLS)
            product = {
                "name": f"Sample Product {random.randint(1, 100)}",
                "category": category,
                "price": random.uniform(10.0, 100.0),
                "image": image_url,
                "approved": True
            }
            products_collection.insert_one(product)
            print(f"Product created: {product['name']} in category {category}")
    except Exception as e:
        print(f"Error creating products: {e}")

# Main script execution
if __name__ == "__main__":
    create_user("admin@kivu.market", "admin123", "admin")
    create_user("seller@test.com", "seller123", "seller")
    create_user("buyer@test.com", "buyer123", "buyer")
    create_products()
    print("Seeding completed.")

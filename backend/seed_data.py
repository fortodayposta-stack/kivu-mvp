import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from models import SellerProduct

async def seed_data():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.kivu_mvp

    # Create Admin Seller
    seller_password = get_password_hash('admin_seller_password')
    seller = await db.sellers.insert_one({
        'username': 'admin_seller',
        'password': seller_password,
        'role': 'seller'
    })
    seller_id = seller.inserted_id

    # Create Admin Buyer
    buyer_password = get_password_hash('admin_buyer_password')
    buyer = await db.buyers.insert_one({
        'username': 'admin_buyer',
        'password': buyer_password,
        'role': 'buyer'
    })

    # Create 12 Approved Products
    products = []
    for i in range(12):
        product = SellerProduct(
            name=f'Product {i+1}',
            nameRw=f'Ibicuruzwa {i+1}',
            description='Sample product description',
            descriptionRw='Ibisobanuro by’icyitegererezo',
            category='Sample Category',
            image='sample_image.png',
            images=['image1.png', 'image2.png'],
            regularPrice=100.0,
            perItemPrice=10.0,
            poolPrice=500.0,
            poolSize=100,
            poolCurrent=50,
            rating=4.5,
            status='approved',
            seller_id=seller_id
        )
        products.append(product)
    await db.products.insert_many(products)

if __name__ == '__main__':
    asyncio.run(seed_data())
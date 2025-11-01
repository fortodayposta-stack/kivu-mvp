import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { ShoppingCart, Zap, ShieldCheck, Star } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import ProductCard from '../components/ProductCard';
import axios from 'axios';

// Определяем API URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const ProductDetail = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const { addToCart } = useContext(AuthContext);
  const { toast } = useToast();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPurchaseType, setSelectedPurchaseType] = useState('perItem'); // 'perItem' or 'pool'

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        // 1. Загружаем основной товар
        const productResponse = await axios.get(`${API}/products/${id}`);
        setProduct(productResponse.data);

        // 2. Загружаем все товары, чтобы найти "связанные"
        const allProductsResponse = await axios.get(`${API}/seller/products/all`);
        
        // Фильтруем, чтобы найти 4 товара из той же категории (но не этот же)
        const related = allProductsResponse.data
          .filter(p => p.category === productResponse.data.category && p.id !== id)
          .slice(0, 4);
        setRelatedProducts(related);

      } catch (err) {
        console.error("Ошибка при загрузке товара:", err);
        setError("Не удалось загрузить товар. Попробуйте снова.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]); // Перезагружаем, если ID в URL меняется

  const handleAddToCart = () => {
    if (!product) return;
    
    const isPool = selectedPurchaseType === 'pool';
    addToCart(product.id, 1, isPool);
    
    toast({
      title: t.productAddedToCart,
      description: language === 'en' ? product.name : product.nameRw,
    });
  };

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Загрузка...</div>;
  if (error) return <div className="container mx-auto px-4 py-8 text-center text-red-600">{error}</div>;
  if (!product) return <div className="container mx-auto px-4 py-8 text-center">Товар не найден.</div>;

  const currentPrice = selectedPurchaseType === 'pool' ? product.poolPrice : product.perItemPrice;
  const name = language === 'en' ? product.name : product.nameRw;
  const description = language === 'en' ? product.description : product.descriptionRw;

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Product Main Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-12 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <img 
                  src={product.image || 'https://via.placeholder.com/500'} 
                  alt={name}
                  className="w-full h-full object-cover" 
                />
              </div>
              {/* TODO: Добавить галерею (product.images), если нужно */}
            </div>

            {/* Product Details */}
            <div>
              <span className="text-blue-600 font-semibold capitalize">{product.category}</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">{name}</h1>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center text-yellow-500">
                  {[...Array(Math.floor(product.rating))].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                  {product.rating % 1 !== 0 && <Star key="half" className="w-5 h-5 fill-current opacity-50" />}
                </div>
                <span className="ml-2 text-gray-600">({product.rating} / 5)</span>
              </div>
              
              <p className="text-gray-700 text-lg mb-6">{description}</p>

              {/* Price & Purchase Type */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => setSelectedPurchaseType('perItem')}
                    className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
                      selectedPurchaseType === 'perItem' 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="block font-bold text-gray-800">{t.buyIndividually}</span>
                    <span className="block text-2xl font-bold text-blue-600">${product.perItemPrice.toFixed(2)}</span>
                  </button>
                  <button
                    onClick={() => setSelectedPurchaseType('pool')}
                    className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
                      selectedPurchaseType === 'pool' 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="block font-bold text-gray-800">{t.joinPool}</span>
                    <span className="block text-2xl font-bold text-green-600">${product.poolPrice.toFixed(2)}</span>
                    <span className="text-sm text-gray-600">
                      {t.poolProgress}: {product.poolCurrent} / {product.poolSize}
                    </span>
                  </button>
                </div>
                
                <div className="text-center">
                  <span className="text-4xl font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
                  {selectedPurchaseType === 'perItem' && product.regularPrice > product.perItemPrice && (
                    <span className="ml-2 text-lg text-gray-500 line-through">${product.regularPrice.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {t.addToCart}
                </Button>
                <Button size="lg" variant="outline" className="flex-1">
                  <Zap className="mr-2 h-5 w-5" />
                  {t.buyNow}
                </Button>
              </div>

              <div className="mt-6 text-sm text-gray-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                <span>{t.secureTransaction}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.relatedProducts}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

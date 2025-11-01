import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { ArrowRight, ShoppingBag, Truck, Zap } from 'lucide-react';
import axios from 'axios';

// Определяем API URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const { language, t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Загружаем все одобренные товары
        const response = await axios.get(`${API}/seller/products/all`);
        setProducts(response.data);

        // Динамически создаем список категорий
        const uniqueCategories = [...new Set(response.data.map(p => p.category))];
        // TODO: В будущем здесь можно будет добавить перевод для категорий
        const categoryObjects = uniqueCategories.map(name => ({
          name: name,
          nameRw: name, // Пока используем одинаковые имена
          icon: ShoppingBag, // Иконка по умолчанию
        }));
        setCategories(categoryObjects);
        
      } catch (err) {
        console.error("Ошибка при загрузке товаров:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Берем первые 8 товаров как "Featured"
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <HeroSection t={t} />

      {/* Featured Products */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">{t.featuredProducts}</h2>
          <p className="text-center text-gray-600 mb-8">{t.featuredProductsSubtitle}</p>
          {loading ? (
            <div className="text-center">Загрузка...</div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500 mb-4">
                {language === 'en' ? 'No products available yet' : language === 'rw' ? 'Nta bicuruzwa bihari' : 'Hakuna bidhaa bado'}
              </p>
              <p className="text-gray-400">
                {language === 'en' ? 'Check back soon for new products!' : language === 'rw' ? 'Subira vuba kugirango ubone ibicuruzwa bishya!' : 'Rudi hivi karibuni kwa bidhaa mpya!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Button asChild variant="default" size="lg">
              <Link to="/products">
                {t.viewAllProducts} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <CategoriesSection categories={categories} t={t} language={language} />

      {/* How It Works Section */}
      <HowItWorksSection t={t} />
    </div>
  );
};

// --- Вспомогательные компоненты ---

const HeroSection = ({ t }) => (
  <div 
    className="relative bg-blue-600 text-white overflow-hidden"
    style={{
      backgroundImage: 'url(https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600&q=80)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    {/* Overlay for better text readability */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-blue-600/70"></div>
    
    <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center relative z-10">
      <div className="md:w-1/2 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">{t.heroTitle}</h1>
        <p className="text-lg md:text-xl mb-8 drop-shadow-md">{t.heroSubtitle}</p>
        <Button asChild variant="secondary" size="lg" className="shadow-xl hover:shadow-2xl transition-shadow">
          <Link to="/products">
            {t.shopNow} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
        <ShoppingBag className="w-48 h-48 md:w-80 md:h-80 opacity-30 drop-shadow-2xl" />
      </div>
    </div>
  </div>
);

const CategoriesSection = ({ categories, t, language }) => (
  <div className="py-16">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">{t.shopByCategory}</h2>
      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{language === 'en' ? 'Categories will appear when products are added' : language === 'rw' ? 'Ibyiciro bizagaragara iyo ibicuruzwa byongeweho' : 'Kategoria zitaonekana bidhaa zinapoongezwa'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/products?category=${category.name}`}
              className="group block"
            >
              <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:bg-blue-100 hover:shadow-lg">
                <category.icon className="h-12 w-12 text-blue-600 mb-4 transition-transform group-hover:scale-110" />
                <h3 className="text-lg font-semibold text-gray-800 capitalize">
                  {language === 'rw' ? category.nameRw : category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  </div>
);

const HowItWorksSection = ({ t }) => (
  <div className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{t.howItWorks}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-blue-100 rounded-full p-4 mb-4">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t.howItWorksStep1Title}</h3>
          <p className="text-gray-600">{t.howItWorksStep1Desc}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-blue-100 rounded-full p-4 mb-4">
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t.howItWorksStep2Title}</h3>
          <p className="text-gray-600">{t.howItWorksStep2Desc}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-blue-100 rounded-full p-4 mb-4">
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t.howItWorksStep3Title}</h3>
          <p className="text-gray-600">{t.howItWorksStep3Desc}</p>
        </div>
      </div>
    </div>
  </div>
);

export default Home;
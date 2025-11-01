import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import ProductCard from '../components/ProductCard';
import { allCategories } from '../mock/allProducts';
import { Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Products = () => {
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [products, setProducts] = useState([]); // Состояние для хранения товаров
  const [loading, setLoading] = useState(true); // Состояние загрузки
  const [error, setError] = useState(null); // Состояние для ошибок

  const searchQuery = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category') || '';

  // Загрузка товаров из базы данных
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/products`);
        setProducts(response.data);
      } catch (err) {
        setError('Ошибка при загрузке товаров');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Фильтр по запросу поиска
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameRw.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по категории
    const categoryFilter = categoryFromUrl || selectedCategory;
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Фильтр по ценовому диапазону
    if (priceRange === 'under50') {
      filtered = filtered.filter(p => p.poolPrice < 50);
    } else if (priceRange === '50to100') {
      filtered = filtered.filter(p => p.poolPrice >= 50 && p.poolPrice <= 100);
    } else if (priceRange === 'over100') {
      filtered = filtered.filter(p => p.poolPrice > 100);
    }

    return filtered;
  }, [searchQuery, selectedCategory, categoryFromUrl, priceRange, products]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {searchQuery ? `${language === 'en' ? 'Search Results' : 'Ibisubizo byo Gushakisha'}` : t.allProducts}
          </h1>
          {searchQuery && (
            <p className="text-gray-600">
              {language === 'en' ? `Showing results for "${searchQuery}"` : `Byerekana ibisubizo kuri "${searchQuery}"`}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">
                  {language === 'en' ? 'Filters' : 'Mushungura'}
                </h2>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-gray-800">{t.categories}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {language === 'en' ? 'All Categories' : 'Ibyiciro Byose'}
                 
                        : 'hover:bg-gray-100 text-gray-700'
                    `
              
                    {language === 'en' ? 'All Prices' : 'Ibiciro Byose'}
                  </button>
                  <button
                    onClick={() => setPriceRange('under50')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      priceRange === 'under50'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {language === 'en' ? 'Under $50' : 'Munsi ya $50'}
                  </button>
                  <button
                    onClick={() => setPriceRange('50to100')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      priceRange === '50to100'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    $50 - $100
                  </button>
                  <button
                    onClick={() => setPriceRange('over100')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      priceRange === 'over100'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {language === 'en' ? 'Over $100' : 'Hejuru ya $100'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-lg">
                <p className="text-2xl text-gray-500 mb-4">
                  {language === 'en' ? 'No products found' : 'Nta bicuruzwa byabonetse'}
                </p>
                <Button onClick={() => window.location.href = '/products'}>
                  {language === 'en' ? 'Clear Filters' : 'Gusiba Mushungura'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
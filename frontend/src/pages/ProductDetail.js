import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getProductReviews } from '../mock/productReviews';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Star, ShoppingCart, Users, Package, Shield, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetail = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState('pool');
  const [addingToCart, setAddingToCart] = useState(false);

  // --- НОВЫЙ КОД ДЛЯ ЗАГРУЗКИ ---
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const productReviews = getProductReviews(parseInt(id));

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">{language === 'en' ? 'Loading Product...' : 'Tegereza...'}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  const poolPercentage = (product.poolCurrent / product.poolSize) * 100;
  const discount = Math.round(((product.regularPrice - product.poolPrice) / product.regularPrice) * 100);
  const currentPrice = selectedOption === 'pool' ? product.poolPrice : product.perItemPrice;
  const totalPrice = (currentPrice * quantity).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-blue-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Back' : 'Gusubira'}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
              <img
                src={product.image}
                alt={language === 'en' ? product.name : product.nameRw}
                className="w-full h-[600px] object-cover"
              />
              {discount > 0 && (
                <div className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                  -{discount}%
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">
              {language === 'en' ? product.name : product.nameRw}
            </h1>

            {/* Rating */}
            <div className="flex items-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i < Math.floor(product.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-3 text-xl text-gray-600">{product.rating} / 5</span>
            </div>

            {/* Price Options */}
            <Card className="mb-6 border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Regular Purchase */}
                  <div 
                    onClick={() => setSelectedOption('regular')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedOption === 'regular'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-700">{t.product.regularPrice}</p>
                        <p className="text-sm text-gray-500">{language === 'en' ? 'Buy now' : 'Gura none'}</p>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">${product.perItemPrice}</div>
                    </div>
                  </div>

                  {/* Pool Purchase */}
                  <div 
                    onClick={() => setSelectedOption('pool')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedOption === 'pool'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="font-semibold text-green-700">{t.product.poolPrice}</p>
                        <p className="text-sm text-gray-500">{language === 'en' ? 'Group buying' : 'Kugura mu tsinda'}</p>
                      </div>
                      <div className="text-2xl font-bold text-green-700">${product.poolPrice}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t.product.poolProgress}</span>
                        <span className="font-semibold text-green-600">
                          {product.poolCurrent}/{product.poolSize} {t.product.people}
                        </span>
                      </div>
                      <Progress value={poolPercentage} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                {language === 'en' ? 'Quantity' : 'Umubare'}
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 text-xl"
                >
                  -
                </Button>
                <span className="text-2xl font-bold w-16 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 text-xl"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Total Price */}
            <div className="mb-6 p-4 bg-gray-100 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-gray-700">
                  {language === 'en' ? 'Total' : 'Igiteranyo'}:
                </span>
                <span className="text-3xl font-bold text-blue-700">${totalPrice}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <Button 
                size="lg"
                onClick={async () => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  setAddingToCart(true);
                  try {
                    await axios.post(`${API}/cart/add`, {
                      product_id: product.id,
                      quantity: quantity,
                      is_pool_purchase: selectedOption === 'pool'
                    }, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    navigate('/cart');
                  } catch (error) {
                    console.error('Error adding to cart:', error);
                    alert(language === 'en' ? 'Failed to add to cart' : 'Ntibyashobotse kongerwa mu kibanza');
                  } finally {
                    setAddingToCart(false);
                  }
                }}
                disabled={addingToCart}
                className={`flex-1 text-lg py-6 transition-all transform hover:scale-105 ${
                  selectedOption === 'pool'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {addingToCart ? (language === 'en' ? 'Adding...' : 'Birimo Kongerwa...') : (selectedOption === 'pool' ? t.product.joinPool : t.product.buyNow)}
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-xl shadow-md">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Group Buying' : 'Kugura mu Tsinda'}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-md">
                <Package className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Fast Delivery' : 'Kohereza Byihuse'}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-md">
                <Shield className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Secure Payment' : 'Kwishyura Neza'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="description">{t.product.description}</TabsTrigger>
              <TabsTrigger value="details">{t.product.details}</TabsTrigger>
              <TabsTrigger value="reviews">{language === 'en' ? 'Reviews' : 'Ibitekerezo'}</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {language === 'en' ? product.description : product.descriptionRw}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between border-b pb-3">
                      <span className="font-semibold text-gray-700">{language === 'en' ? 'Category' : 'Icyiciro'}:</span>
                      <span className="text-gray-600">{product.category}</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="font-semibold text-gray-700">{language === 'en' ? 'Rating' : 'Amanota'}:</span>
                      <span className="text-gray-600">{product.rating} / 5</span>
                    </div>
                    <div className="flex justify-between border-b pb-3">
                      <span className="font-semibold text-gray-700">{language === 'en' ? 'Pool Size' : 'Ingano y\'Itsinda'}:</span>
                      <span className="text-gray-600">{product.poolSize} {t.product.people}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">{language === 'en' ? 'Discount' : 'Igabanuka'}:</span>
                      <span className="text-green-600 font-bold">{discount}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">
                        {language === 'en' ? 'Customer Reviews' : language === 'rw' ? 'Ibitekerezo by\'Abakiriya' : 'Maoni ya Wateja'}
                      </h3>
                      <p className="text-gray-600">
                        {productReviews.length} {language === 'en' ? 'reviews' : language === 'rw' ? 'ibitekerezo' : 'maoni'}
                      </p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      {language === 'en' ? 'Write a Review' : 'Andika Igitekerezo'}
                    </Button>
                  </div>

                  {productReviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>{language === 'en' ? 'No reviews yet. Be the first to review this product!' : language === 'rw' ? 'Nta bitekerezo. Wowe wa mbere gutanga igitekerezo!' : 'Hakuna maoni bado. Kuwa wa kwanza kutoa maoni!'}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {productReviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-b-0">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                            {review.userName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">
                                  {language === 'en' ? review.userName : language === 'rw' ? review.userNameRw : review.userNameSw}
                                </h4>
                                <p className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                              </div>
                              {review.verified && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {language === 'en' ? '✓ Verified Purchase' : '✓ Igura Ryemejwe'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-gray-700 mb-3">
                              {language === 'en' ? review.comment : language === 'rw' ? review.commentRw : review.commentSw}
                            </p>
                            <button className="text-sm text-gray-500 hover:text-gray-700">
                              {language === 'en' ? 'Helpful' : language === 'rw' ? 'Byafashije' : 'Inasaidia'} ({review.helpful})
                            </button>
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
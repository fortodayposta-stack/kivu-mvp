import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

const ProductCard = ({ product }) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const poolPercentage = (product.poolCurrent / product.poolSize) * 100;
  const discount = Math.round(((product.regularPrice - product.poolPrice) / product.regularPrice) * 100);

  return (
    <Card 
      className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={language === 'en' ? product.name : product.nameRw}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{discount}%
          </div>
        )}
      </div>

      <CardContent className="p-5">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-800 group-hover:text-blue-700 transition-colors">
          {language === 'en' ? product.name : product.nameRw}
        </h3>

        {/* Rating */}
        <div className="flex items-center mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(product.rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-2 text-sm text-gray-600">{product.rating}</span>
        </div>

        {/* Pricing */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.product.regularPrice}:</span>
            <span className="text-lg font-bold text-gray-400 line-through">
              ${product.regularPrice}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.product.perItem}:</span>
            <span className="text-lg font-bold text-gray-800">
              ${product.perItemPrice}
            </span>
          </div>
          <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg">
            <span className="text-sm font-semibold text-green-700">{t.product.poolPrice}:</span>
            <span className="text-xl font-bold text-green-700">
              ${product.poolPrice}
            </span>
          </div>
        </div>

        {/* Pool Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">{t.product.poolProgress}</span>
            <span className="font-semibold text-green-600">
              {product.poolCurrent}/{product.poolSize} {t.product.people}
            </span>
          </div>
          <Progress value={poolPercentage} className="h-2" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Handle add to cart
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t.product.buyNow}
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Handle join pool
            }}
          >
            {t.product.joinPool}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Upload, X, Plus, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { allCategories } from '../../mock/allProducts'; // Мы все еще берем категории из mock

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddProduct = () => {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // --- ИЗМЕНЕНИЕ: Форма теперь содержит ВСЕ поля ---
  const [formData, setFormData] = useState({
    name: '',
    nameRw: '',
    description: '',
    descriptionRw: '',
    category: '',
    image: '', // Главное изображение
    regularPrice: '',
    perItemPrice: '',
    poolPrice: '',
    poolSize: '',
    poolCurrent: '',
    rating: '',
  });
  const [images, setImages] = useState([]); // Дополнительные изображения

  // (Переводы не изменились, пропускаем)
  const content = {
    en: {
      title: 'Add New Product',
      subtitle: 'Submit your product for approval',
      productName: 'Product Name',
      description: 'Product Description',
      category: 'Category',
      selectCategory: 'Select a category',
      regularPrice: 'Regular Price',
      poolPrice: 'Pool Price (Group Buying)',
      images: 'Product Images',
      addImage: 'Add Image URL',
      removeImage: 'Remove',
      submit: 'Submit for Approval',
      submitting: 'Submitting...',
      success: 'Product submitted successfully! It will be reviewed by admin.',
      error: 'Failed to submit product. Please try again.',
      notSeller: 'Only sellers can add products.',
      imagePlaceholder: 'Enter image URL (e.g., https://example.com/image.jpg)',
    },
    rw: {
      title: 'Ongeraho Igicuruzwa Gishya',
      subtitle: 'Shyira igicuruzwa cyawe kugira ngo cyemezwe',
      productName: 'Izina ry\'Igicuruzwa',
      description: 'Ibisobanuro by\'Igicuruzwa',
      category: 'Icyiciro',
      selectCategory: 'Hitamo icyiciro',
      regularPrice: 'Igiciro Gisanzwe',
      poolPrice: 'Igiciro cy\'Itsinda',
      images: 'Amashusho y\'Igicuruzwa',
      addImage: 'Ongeraho Ishusho',
      removeImage: 'Kuraho',
      submit: 'Shyira kugira ngo Yemezwe',
      submitting: 'Birimo Koherezwa...',
      success: 'Igicuruzwa cyoherejwe neza! Kizasuzumwa na Admin.',
      error: 'Ntibyashobotse kohereza igicuruzwa. Ongera ugerageze.',
      notSeller: 'Abacuruzi gusa bashobora kongeraho ibicuruzwa.',
      imagePlaceholder: 'Shyiramo URL y\'ishusho',
    },
    sw: {
      title: 'Ongeza Bidhaa Mpya',
      subtitle: 'Wasilisha bidhaa yako kwa idhini',
      productName: 'Jina la Bidhaa',
      description: 'Maelezo ya Bidhaa',
      category: 'Kategoria',
      selectCategory: 'Chagua kategoria',
      regularPrice: 'Bei ya Kawaida',
      poolPrice: 'Bei ya Kikundi',
      images: 'Picha za Bidhaa',
      addImage: 'Ongeza URL ya Picha',
      removeImage: 'Ondoa',
      submit: 'Wasilisha kwa Idhini',
      submitting: 'Inatuma...',
      success: 'Bidhaa imewasilishwa! Itakaguliwa na msimamizi.',
      error: 'Imeshindwa kuwasilisha bidhaa. Tafadhali jaribu tena.',
      notSeller: 'Wauzaji tu wanaweza kuongeza bidhaa.',
      imagePlaceholder: 'Ingiza URL ya picha',
    },
  };

  const t = content[language] || content['en'];


  React.useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.account_type !== 'seller') {
      alert(t.notSeller || 'Only sellers can add products.');
      navigate('/');
    }
  }, [user, navigate, t.notSeller]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addImageUrl = () => setImages([...images, '']);
  const updateImageUrl = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };
  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const validImages = images.filter(img => img.trim() !== '');
      
      // --- ИЗМЕНЕНИЕ: Отправляем ВСЕ поля ---
      const productData = {
        name: formData.name,
        nameRw: formData.nameRw || formData.name, // Если nameRw не заполнено, используем name
        description: formData.description,
        descriptionRw: formData.descriptionRw || formData.description, // То же самое
        category: formData.category,
        image: formData.image, // Главное изображение
        images: validImages, // Галерея
        regularPrice: parseFloat(formData.regularPrice),
        perItemPrice: parseFloat(formData.perItemPrice),
        poolPrice: parseFloat(formData.poolPrice),
        poolSize: parseInt(formData.poolSize) || 100, // Значение по умолчанию 100
        poolCurrent: parseInt(formData.poolCurrent) || 0, // Значение по умолчанию 0
        rating: parseFloat(formData.rating) || 4.5, // Значение по умолчанию 4.5
      };

      await axios.post(
        `${API}/seller/products`,
        productData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(t.success || 'Product submitted successfully!');
      navigate('/seller/products');
    } catch (error) {
      console.error('Error submitting product:', error);
      setError(error.response?.data?.detail || (t.error || 'Failed to submit product.'));
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.account_type !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t.title || 'Add New Product'}</h1>
          <p className="text-gray-600">{t.subtitle || 'Submit your product for approval'}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.title || 'Add New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* --- НОВЫЕ ПОЛЯ --- */}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name (EN)</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={loading} />
                </div>
                <div>
                  <Label htmlFor="nameRw">Product Name (RW)</Label>
                  <Input id="nameRw" name="nameRw" value={formData.nameRw} onChange={handleChange} disabled={loading} />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (EN)</Label>
                <Textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} required disabled={loading} />
              </div>
              <div>
                <Label htmlFor="descriptionRw">Description (RW)</Label>
                <Textarea id="descriptionRw" name="descriptionRw" rows={3} value={formData.descriptionRw} onChange={handleChange} disabled={loading} />
              </div>

              <div>
                <Label htmlFor="image">Main Image URL</Label>
                <Input id="image" name="image" value={formData.image} onChange={handleChange} required disabled={loading} placeholder="https://.../main-image.jpg" />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select id="category" name="category" value={formData.category} onChange={handleChange} required disabled={loading} className="w-full p-2 border rounded-md">
                  <option value="">{t.selectCategory || 'Select a category'}</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {language === 'en' ? cat.name : cat.nameRw || cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="regularPrice">Regular Price ($)</Label>
                  <Input id="regularPrice" name="regularPrice" type="number" step="0.01" value={formData.regularPrice} onChange={handleChange} required disabled={loading} placeholder="120.00" />
                </div>
                <div>
                  <Label htmlFor="perItemPrice">Per Item Price ($)</Label>
                  <Input id="perItemPrice" name="perItemPrice" type="number" step="0.01" value={formData.perItemPrice} onChange={handleChange} required disabled={loading} placeholder="99.99" />
                </div>
                 <div>
                  <Label htmlFor="poolPrice">Pool Price ($)</Label>
                  <Input id="poolPrice" name="poolPrice" type="number" step="0.01" value={formData.poolPrice} onChange={handleChange} required disabled={loading} placeholder="79.99" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input id="rating" name="rating" type="number" step="0.1" max="5" min="0" value={formData.rating} onChange={handleChange} required disabled={loading} placeholder="4.5" />
                </div>
                <div>
                  <Label htmlFor="poolSize">Pool Size</Label>
                  <Input id="poolSize" name="poolSize" type="number" value={formData.poolSize} onChange={handleChange} required disabled={loading} placeholder="100" />
                </div>
                 <div>
                  <Label htmlFor="poolCurrent">Pool Current</Label>
                  <Input id="poolCurrent" name="poolCurrent" type="number" value={formData.poolCurrent} onChange={handleChange} required disabled={loading} placeholder="0" />
                </div>
              </div>

              {/* --- КОНЕЦ НОВЫХ ПОЛЕЙ --- */}
              
              <div>
                <Label>Additional Images (Gallery)</Label>
                <div className="space-y-3 mt-2">
                  {images.map((img, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={img} onChange={(e) => updateImageUrl(index, e.target.value)} placeholder={t.imagePlaceholder || 'Enter image URL'} disabled={loading} />
                      <Button type="button" variant="outline" onClick={() => removeImage(index)} disabled={loading}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addImageUrl} disabled={loading} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {t.addImage || 'Add Image URL'}
                  </Button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                <Upload className="h-5 w-5 mr-2" />
                {loading ? (t.submitting || 'Submitting...') : (t.submit || 'Submit for Approval')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProduct;
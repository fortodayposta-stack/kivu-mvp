import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Check, X, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PendingProducts = ({ onStatsChange }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchPendingProducts();
  }, [token]);

  const fetchPendingProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/products/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching pending products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`${API}/admin/products/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      onStatsChange(updatedProducts.length);
      alert(`Product approved! It will now appear on the marketplace.`);
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Failed to approve product.');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason (optional):');
    try {
      await axios.post(`${API}/admin/products/reject/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      onStatsChange(updatedProducts.length);
      alert(`Product rejected. Seller will be notified (in future).`);
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Failed to reject product.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading pending products...</div>;
  }
  
  const pendingProducts = products;

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Pending Products ({pendingProducts.length})</h2>
        <p className="text-gray-600">Review and approve products submitted by sellers</p>
      </div>

      {pendingProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No pending products at this time</p>
        </div>
      ) : (
        pendingProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex gap-6">
                {/* Product Image */}
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-32 h-32 object-cover rounded-lg"
                />

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-500">Seller: {product.seller_name}</p>
                      <p className="text-sm text-gray-500">Submitted: {new Date(product.created_at).toLocaleString()}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Pending Review
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{product.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-semibold">{product.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Regular Price</p>
                      <p className="font-semibold text-lg">${product.price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pool Price</p>
                      <p className="font-semibold text-lg text-green-600">${product.pool_price}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{product.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-gray-700">{product.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Product Details</h4>
                              <p className="text-sm">Category: {product.category}</p>
                              <p className="text-sm">Regular Price: ${product.price}</p>
                              <p className="text-sm">Pool Price: ${product.pool_price}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Seller Information</h4>
                              <p className="text-sm">Name: {product.seller_name}</p>
                              <p className="text-sm">Submitted: {new Date(product.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={() => handleApprove(product.id)}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>

                    <Button
                      onClick={() => handleReject(product.id)}
                      variant="destructive"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default PendingProducts;
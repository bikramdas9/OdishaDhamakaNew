import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Leaf, Drumstick } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; contact: string; email?: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
  config?: { display: { blocks: Record<string, unknown>; sequence: string[]; preferences: { show_default_blocks: boolean } } };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { code: string; description: string; source: string; step: string; reason: string } }) => void) => void;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCartStore();
  const { user, isLoggedIn } = useAuthStore();
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!isLoggedIn()) { toast.error('Please login to place order'); navigate('/auth'); return; }
    if (!address.trim() || address.trim().length < 10) { toast.error('Please enter a valid delivery address'); return; }

    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Payment gateway failed to load'); return; }

      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
        delivery_address: address,
        special_instructions: instructions || undefined,
      });

      const options: RazorpayOptions = {
        key: data.order.key_id,
        amount: Math.round(data.order.amount * 100),
        currency: 'INR',
        name: 'Odisha Dhamaka',
        description: 'Authentic Odia Food Order',
        image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=100',
        order_id: data.order.razorpay_order_id,
        handler: async (response) => {
          try {
            await api.post('/orders/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: data.order.id,
            });
            clearCart();
            toast.success('Order placed successfully!');
            navigate('/orders');
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: user?.name ?? '', contact: user?.mobile ?? '' },
        theme: { color: '#f97316' },
        modal: { ondismiss: () => toast('Payment cancelled') },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some delicious Odia dishes!</p>
          <Link to="/" className="btn-primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Back to Menu
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {item.is_vegetarian
                    ? <Leaf size={12} className="text-green-600" />
                    : <Drumstick size={12} className="text-red-500" />
                  }
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">₹{item.price} each</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-gray-500 hover:text-brand-600">
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-gray-500 hover:text-brand-600">
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 mt-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery details */}
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Delivery Details</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address *</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="House no, Street, Landmark, Area, City..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Instructions (Optional)</label>
              <input
                className="input"
                placeholder="e.g., Less spicy, Extra chutney..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                maxLength={300}
              />
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>₹{total().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery fee</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span>
              <span>₹{total().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <img src="https://cdn.razorpay.com/logo.svg" alt="Razorpay" className="h-6 opacity-60" />
          <span className="text-xs text-gray-400">Secure payment via Razorpay · UPI · Cards · QR Code</span>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="btn-primary w-full text-base py-4"
        >
          {loading ? 'Processing...' : `Pay ₹${total().toFixed(2)} & Place Order`}
        </button>
      </div>
    </div>
  );
}

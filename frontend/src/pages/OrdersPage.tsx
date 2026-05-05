import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, ChefHat, Package } from 'lucide-react';
import api from '../lib/api';

interface OrderItem { name: string; price: number; quantity: number; }
interface Order {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  delivery_address: string;
  special_instructions?: string;
  created_at: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-600 bg-yellow-50',  icon: <Clock size={14} /> },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-600 bg-blue-50',     icon: <CheckCircle size={14} /> },
  preparing:  { label: 'Preparing',  color: 'text-purple-600 bg-purple-50', icon: <ChefHat size={14} /> },
  ready:      { label: 'Ready',      color: 'text-green-600 bg-green-50',   icon: <Package size={14} /> },
  delivered:  { label: 'Delivered',  color: 'text-green-700 bg-green-50',   icon: <CheckCircle size={14} /> },
  cancelled:  { label: 'Cancelled',  color: 'text-red-600 bg-red-50',       icon: <XCircle size={14} /> },
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await api.get('/orders/my');
      return res.data.orders;
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Back to Menu
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="text-center py-16">
            <Package size={56} className="text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">No orders yet</h2>
            <p className="text-gray-400 mb-6">Your order history will appear here</p>
            <Link to="/" className="btn-primary">Order Now</Link>
          </div>
        )}

        <div className="space-y-4">
          {data?.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            return (
              <div key={order.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.name} × {item.quantity}</span>
                      <span className="text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400 truncate max-w-[60%]">{order.delivery_address}</span>
                  <span className="font-bold text-gray-900">₹{parseFloat(order.total_amount.toString()).toFixed(2)}</span>
                </div>

                {order.payment_status === 'paid' && (
                  <div className="mt-2">
                    <span className="text-xs text-green-600 font-medium">✓ Payment successful</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

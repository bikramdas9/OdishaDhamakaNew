import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, ChefHat, Package, RefreshCw, LogOut, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface OrderItem { name: string; price: number; quantity: number; }
interface AdminOrder {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  delivery_address: string;
  special_instructions?: string;
  created_at: string;
  customer_name: string;
  customer_mobile: string;
  razorpay_payment_id?: string;
  items: OrderItem[];
}

const STATUS_OPTIONS = ['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const;
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: <Clock size={13} /> },
  confirmed: { label: 'Confirmed', color: 'text-blue-700 bg-blue-50 border-blue-200',       icon: <CheckCircle size={13} /> },
  preparing: { label: 'Preparing', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: <ChefHat size={13} /> },
  ready:     { label: 'Ready',     color: 'text-green-700 bg-green-50 border-green-200',    icon: <Package size={13} /> },
  delivered: { label: 'Delivered', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle size={13} /> },
  cancelled: { label: 'Cancelled', color: 'text-red-700 bg-red-50 border-red-200',          icon: <XCircle size={13} /> },
};

export default function AdminPage() {
  const [filter, setFilter] = useState<string>('all');
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<AdminOrder[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data.orders;
    },
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } finally {
      clearAuth();
      navigate('/');
    }
  };

  const filtered = filter === 'all' ? data : data?.filter((o) => o.status === filter);
  const counts = data?.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>) ?? {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xl font-bold text-brand-500">🍛 Odisha Dhamaka</Link>
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => refetch()} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
              <RefreshCw size={16} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {(['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`card p-3 text-center transition-all ${filter === s ? 'ring-2 ring-brand-400' : 'hover:shadow-md'}`}
            >
              <div className="text-2xl font-bold text-gray-900">
                {s === 'all' ? (data?.length ?? 0) : (counts[s] ?? 0)}
              </div>
              <div className="text-xs text-gray-500 capitalize mt-0.5">{s === 'all' ? 'Total' : s}</div>
            </button>
          ))}
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-4">
          Orders {filter !== 'all' && <span className="text-brand-500 capitalize">— {filter}</span>}
          {isLoading && <span className="text-sm text-gray-400 font-normal ml-2">Loading...</span>}
        </h1>

        <div className="space-y-3">
          {filtered?.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            return (
              <div key={order.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {order.payment_status === 'paid' && (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">✓ Paid</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-medium text-gray-700">{order.customer_name}</span>
                      <a href={`tel:${order.customer_mobile}`} className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600">
                        <Phone size={12} /> +91 {order.customer_mobile}
                      </a>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">₹{parseFloat(order.total_amount.toString()).toFixed(2)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.name} × {item.quantity}</span>
                      <span className="text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mb-3">📍 {order.delivery_address}</p>
                {order.special_instructions && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">📝 {order.special_instructions}</p>
                )}

                {/* Status update */}
                {order.status !== 'delivered' && order.status !== 'cancelled' && order.payment_status === 'paid' && (
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus.mutate({ id: order.id, status: s })}
                        disabled={updateStatus.isPending || order.status === s}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                          order.status === s
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600'
                        } disabled:opacity-50`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {!isLoading && (!filtered || filtered.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p>No orders {filter !== 'all' && `with status "${filter}"`}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

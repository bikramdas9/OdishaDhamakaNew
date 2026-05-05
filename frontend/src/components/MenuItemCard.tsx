import { Plus, Minus, Leaf, Drumstick } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_vegetarian: boolean;
}

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.id === item.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className="card flex gap-3 p-3 hover:shadow-md transition-shadow">
      <div className="relative flex-shrink-0">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-24 h-24 rounded-xl object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
          }}
        />
        <span className={`absolute top-1 left-1 p-0.5 rounded bg-white border ${item.is_vegetarian ? 'border-green-500' : 'border-red-400'}`}>
          {item.is_vegetarian
            ? <Leaf size={10} className="text-green-600" />
            : <Drumstick size={10} className="text-red-500" />
          }
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-gray-900">₹{item.price}</span>
          {qty === 0 ? (
            <button
              onClick={() => addItem({ id: item.id, name: item.name, price: item.price, image_url: item.image_url, is_vegetarian: item.is_vegetarian })}
              className="flex items-center gap-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} /> Add
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-brand-50 rounded-lg px-1 py-0.5">
              <button onClick={() => updateQuantity(item.id, qty - 1)} className="p-1 hover:text-brand-700 text-brand-600 transition-colors">
                <Minus size={14} />
              </button>
              <span className="text-sm font-bold text-brand-700 w-4 text-center">{qty}</span>
              <button onClick={() => updateQuantity(item.id, qty + 1)} className="p-1 hover:text-brand-700 text-brand-600 transition-colors">
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import MenuItemCard from '../components/MenuItemCard';
import { useCartStore } from '../store/cartStore';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_vegetarian: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  items: MenuItem[];
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((s) => s.itemCount());
  const total = useCartStore((s) => s.total());

  const { data, isLoading, isError } = useQuery<Category[]>({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await api.get('/menu');
      return res.data.data;
    },
  });

  const displayCategory = activeCategory ?? data?.[0]?.id;
  const activeItems = data?.find((c) => c.id === displayCategory)?.items ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-500 to-orange-400 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <span>🌶️</span> Authentic Odia Cloud Kitchen · Hyderabad
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Taste of Odisha,<br />Delivered to Your Door
          </h1>
          <p className="text-lg md:text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            From the sacred shores of Puri to your plate — authentic Odia cuisine made with love and tradition.
          </p>
          <button
            onClick={() => menuRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-brand-600 hover:bg-orange-50 font-bold py-3 px-8 rounded-xl text-lg transition-all active:scale-95 shadow-lg"
          >
            Order Now
          </button>
        </div>
      </section>

      {/* Quick info bar */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
          <span className="flex items-center gap-1.5"><Clock size={15} className="text-brand-500" /> 11 AM – 10 PM Daily</span>
          <span className="flex items-center gap-1.5"><MapPin size={15} className="text-brand-500" /> Newhafeezpet, Hyderabad</span>
          <span className="flex items-center gap-1.5"><Phone size={15} className="text-brand-500" /> +91 99999 99999</span>
        </div>
      </div>

      {/* Menu Section */}
      <section id="menu" ref={menuRef} className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Menu</h2>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-gray-500">
            Failed to load menu. Please refresh.
          </div>
        )}

        {data && (
          <>
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {data.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    displayCategory === cat.id
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <img src={cat.image_url} alt="" className="w-5 h-5 rounded object-cover" />
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Category description */}
            {data.find((c) => c.id === displayCategory) && (
              <p className="text-sm text-gray-500 mb-4 italic">
                {data.find((c) => c.id === displayCategory)?.description}
              </p>
            )}

            {/* Menu items grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Our Story */}
      <section id="our-story" className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-brand-500 font-semibold text-sm uppercase tracking-wide">Our Story</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">From Puri to Hyderabad</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600"
                alt="Odia cuisine"
                className="rounded-2xl shadow-md w-full h-64 object-cover"
              />
            </div>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Born in the sacred land of Puri, Odisha — home of Lord Jagannath — Odisha Dhamaka was founded with a single mission: to bring the authentic, soul-warming flavours of Odia cuisine to the people of Hyderabad.
              </p>
              <p>
                Every dish is prepared fresh daily using traditional recipes passed down through generations. From the comforting <strong>Pakhala Bhata</strong> to the celebratory <strong>Chhena Poda</strong>, we honour the culinary heritage of Odisha in every bite.
              </p>
              <p>
                We believe food is not just nourishment — it is culture, it is memory, it is home. Welcome to Odisha Dhamaka. <em>Taste the soul of Odisha.</em>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Location */}
      <section id="contact" className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Find Us</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MapPin className="text-brand-500" size={22} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Subash Chandra Bose Nagar,<br />
                Newhafeezpet, Hyderabad,<br />
                Telangana – 500049
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Phone className="text-brand-500" size={22} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
              <p className="text-sm text-gray-600">+91 99999 99999</p>
              <p className="text-sm text-gray-600 mt-1">odishadhamaka@gmail.com</p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="text-brand-500" size={22} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Hours</h3>
              <p className="text-sm text-gray-600">Monday – Sunday</p>
              <p className="text-sm text-gray-600 mt-1">11:00 AM – 10:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky cart bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <Link
            to="/cart"
            className="flex items-center justify-between bg-brand-500 text-white rounded-2xl px-5 py-3.5 shadow-xl hover:bg-brand-600 transition-colors"
          >
            <span className="bg-brand-400 text-white text-xs font-bold px-2 py-0.5 rounded-lg">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
            <span className="font-semibold">View Cart</span>
            <span className="font-bold">₹{total.toFixed(2)} <ChevronRight size={16} className="inline" /></span>
          </Link>
        </div>
      )}
    </div>
  );
}

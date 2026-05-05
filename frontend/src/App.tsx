import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { RequireAuth, RequireAdmin } from './components/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="text-4xl animate-bounce block mb-2">🍛</span>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        {/* Admin: no Navbar */}
        <Route path="/admin" element={
          <RequireAdmin>
            <Suspense fallback={<PageLoader />}>
              <AdminPage />
            </Suspense>
          </RequireAdmin>
        } />

        {/* All other routes: with Navbar */}
        <Route path="/*" element={
          <>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={
                  <RequireAuth>
                    <OrdersPage />
                  </RequireAuth>
                } />
                <Route path="*" element={
                  <div className="min-h-screen flex items-center justify-center text-center">
                    <div>
                      <p className="text-6xl mb-4">🍽️</p>
                      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
                      <a href="/" className="text-brand-500 hover:underline">Go back home</a>
                    </div>
                  </div>
                } />
              </Routes>
            </Suspense>
          </>
        } />
      </Routes>
    </div>
  );
}

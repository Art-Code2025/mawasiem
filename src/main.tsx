import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ServiceDetail from './pages/ServiceDetail';
import Login from './Login';
import Dashboard from './Dashboard';
import ServiceForm from './ServiceForm';
import About from './pages/About';
import Contact from './pages/Contact';
import Media from './pages/Media';
import Partners from './pages/Partners';
import './index.css';

// تعريف Props لـ ProtectedRoute
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// مكون للتحكم في النافبار والـ padding
const LayoutWrapper: React.FC = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/dashboard'];

  // التحقق إذا المسار الحالي هو /login أو بيبدأ بـ /dashboard
  const shouldHideNavbar = hideNavbarPaths.some(path => 
    path === '/login' ? location.pathname === path : location.pathname.startsWith(path)
  );

  // إضافة pt-24 بس لو النافبار موجود
  const contentClass = shouldHideNavbar ? '' : 'pt-24';

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <div className={contentClass}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/:id" element={<ProtectedRoute><ServiceDetail /></ProtectedRoute>} />
          <Route path="/dashboard/add" element={<ProtectedRoute><ServiceForm /></ProtectedRoute>} />
          <Route path="/dashboard/edit/:id" element={<ProtectedRoute><ServiceForm /></ProtectedRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/media" element={<Media />} />
          <Route path="/partners" element={<Partners />} />
        </Routes>
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LayoutWrapper />
    </BrowserRouter>
  </React.StrictMode>
);
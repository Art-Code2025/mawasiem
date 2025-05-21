import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided } from 'react-beautiful-dnd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import logo from './assets/logo.png';

// تعريف نوع الخدمة
interface Service {
  id: number;
  name: string;
  homeShortDescription: string;
  detailsShortDescription: string;
  description: string;
  mainImage: string;
  detailedImages: string[];
  imageDetails: string[];
  createdAt?: string;
}

// تعريف نوع إحصائيات الصور
interface ImageStats {
  imageCount: number;
  totalSizeMB: number;
  warning: string | null;
}

// تعريف نوع بيانات الزيارات
interface VisitData {
  name: string;
  visits: number;
}

const Dashboard: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [originalServices, setOriginalServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>('name-asc');
  const [filterOption, setFilterOption] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [imageStatsModal, setImageStatsModal] = useState<{ [key: number]: ImageStats | undefined }>({});
  const [displayMode, setDisplayMode] = useState<'grid' | 'list' | 'carousel'>('grid');
  const [isOrderChanged, setIsOrderChanged] = useState<boolean>(false);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);
  const [visitData, setVisitData] = useState<VisitData[]>([]);
  const navigate = useNavigate();

  const getColumns = () => {
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  useEffect(() => {
    fetchServices();
    const savedMode = localStorage.getItem('displayMode') as 'grid' | 'list' | 'carousel';
    if (savedMode) {
      setDisplayMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      loadVisitData();
    }
  }, [services, filteredServices]);

  const fetchServices = () => {
    setLoading(true);
    fetch('http://localhost:3001/api/services')
      .then(response => {
        if (!response.ok) {
          throw new Error('فشل في جلب الخدمات');
        }
        return response.json();
      })
      .then(data => {
        const savedOrder = localStorage.getItem('servicesOrder');
        let sortedData = sortServices(data, sortOption);
        if (savedOrder) {
          const orderedIds = JSON.parse(savedOrder) as number[];
          sortedData = orderedIds
            .map(id => sortedData.find(service => service.id === id))
            .filter((service): service is Service => service !== undefined);
          const existingIds = new Set(orderedIds);
          sortedData = [
            ...sortedData,
            ...data.filter((service: Service) => !existingIds.has(service.id))
          ];
        }
        setServices(sortedData);
        setOriginalServices(sortedData);
        applyFilter(sortedData, filterOption, searchTerm);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message || 'حدث خطأ أثناء جلب الخدمات');
        setLoading(false);
        toast.error(error.message || 'حدث خطأ أثناء جلب الخدمات');
      });
  };

  const loadVisitData = () => {
    const visits = JSON.parse(localStorage.getItem('serviceVisits') || '{}');
    const data: VisitData[] = services.map(service => ({
      name: service.name,
      visits: visits[service.id] || 0,
    }));
    setVisitData(data);
  };

  const sortServices = (data: Service[], option: string) => {
    const sorted = [...data];
    if (option === 'name-asc') {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (option === 'name-desc') {
      return sorted.sort((a, b) => b.name.localeCompare(b.name));
    } else if (option === 'date-asc') {
      return sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
        return dateA - dateB;
      });
    } else if (option === 'date-desc') {
      return sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
        return dateB - dateA;
      });
    }
    return sorted;
  };

  const applyFilter = (data: Service[], option: string, search: string) => {
    let filtered = [...data];
    if (option === 'withImages') {
      filtered = data.filter(service => service.detailedImages && service.detailedImages.length > 0);
    } else if (option === 'withoutImages') {
      filtered = data.filter(service => !service.detailedImages || service.detailedImages.length === 0);
    } else if (option === 'moreThan5Images') {
      filtered = data.filter(service => service.detailedImages && service.detailedImages.length > 5);
    }

    if (search) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.homeShortDescription.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption);
    const sorted = sortServices(services, newSortOption);
    setServices(sorted);
    setOriginalServices(sorted);
    applyFilter(sorted, filterOption, searchTerm);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilterOption = e.target.value;
    setFilterOption(newFilterOption);
    applyFilter(services, newFilterOption, searchTerm);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    applyFilter(services, filterOption, newSearchTerm);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;

    fetch(`http://localhost:3001/api/services/${id}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('فشل في حذف الخدمة');
        }
        setServices(services.filter(service => service.id !== id));
        setFilteredServices(filteredServices.filter(service => service.id !== id));
        setOriginalServices(originalServices.filter(service => service.id !== id));
        setSuccess('تم حذف الخدمة بنجاح!');
        toast.success('تم حذف الخدمة بنجاح!');
        setTimeout(() => setSuccess(null), 3000);
        const visits = JSON.parse(localStorage.getItem('serviceVisits') || '{}');
        delete visits[id];
        localStorage.setItem('serviceVisits', JSON.stringify(visits));
      })
      .catch(error => {
        setError(error.message || 'حدث خطأ أثناء حذف الخدمة');
        toast.error(error.message || 'حدث خطأ أثناء حذف الخدمة');
        setTimeout(() => setError(null), 3000);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const handleImageStats = (serviceId: number) => {
    fetch(`http://localhost:3001/api/services/${serviceId}/images-stats`)
      .then(response => {
        if (!response.ok) {
          throw new Error('فشل في جلب إحصائيات الصور');
        }
        return response.json();
      })
      .then(data => {
        setImageStatsModal(prev => ({ ...prev, [serviceId]: data }));
      })
      .catch(error => {
        toast.error(error.message || 'حدث خطأ أثناء جلب إحصائيات الصور');
      });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedServices = Array.from(filteredServices);
    const [movedService] = reorderedServices.splice(result.source.index, 1);
    reorderedServices.splice(result.destination.index, 0, movedService);

    setFilteredServices(reorderedServices);
    setServices(reorderedServices);
    setIsOrderChanged(true);
  };

  const moveServiceUp = (index: number) => {
    const columns = getColumns();
    const targetIndex = index - columns;
    if (targetIndex < 0) return;

    const reorderedServices = [...filteredServices];
    [reorderedServices[targetIndex], reorderedServices[index]] = [reorderedServices[index], reorderedServices[targetIndex]];
    setFilteredServices(reorderedServices);
    setServices(reorderedServices);
    setIsOrderChanged(true);
  };

  const moveServiceDown = (index: number) => {
    const columns = getColumns();
    const targetIndex = index + columns;
    if (targetIndex >= filteredServices.length) return;

    const reorderedServices = [...filteredServices];
    [reorderedServices[targetIndex], reorderedServices[index]] = [reorderedServices[index], reorderedServices[targetIndex]];
    setFilteredServices(reorderedServices);
    setServices(reorderedServices);
    setIsOrderChanged(true);
  };

  const moveServiceRight = (index: number) => {
    const columns = getColumns();
    const rowStart = Math.floor(index / columns) * columns;
    const rowEnd = Math.min(rowStart + columns - 1, filteredServices.length - 1);
    const targetIndex = index + 1;
    if (targetIndex > rowEnd || targetIndex >= filteredServices.length) return;

    const reorderedServices = [...filteredServices];
    [reorderedServices[targetIndex], reorderedServices[index]] = [reorderedServices[index], reorderedServices[targetIndex]];
    setFilteredServices(reorderedServices);
    setServices(reorderedServices);
    setIsOrderChanged(true);
  };

  const moveServiceLeft = (index: number) => {
    const columns = getColumns();
    const rowStart = Math.floor(index / columns) * columns;
    const targetIndex = index - 1;
    if (targetIndex < rowStart) return;

    const reorderedServices = [...filteredServices];
    [reorderedServices[targetIndex], reorderedServices[index]] = [reorderedServices[index], reorderedServices[targetIndex]];
    setFilteredServices(reorderedServices);
    setServices(reorderedServices);
    setIsOrderChanged(true);
  };

  const handleSaveOrder = () => {
    setIsSavingOrder(true);

    localStorage.setItem('displayMode', displayMode);
    const orderedIds = filteredServices.map(service => service.id);
    localStorage.setItem('servicesOrder', JSON.stringify(orderedIds));

    setTimeout(() => {
      toast.success('تم حفظ ترتيب الخدمات وطريقة العرض بنجاح!');
      setIsOrderChanged(false);
      setOriginalServices([...filteredServices]);
      setIsSavingOrder(false);
    }, 1000);
  };

  const handleCancelChanges = () => {
    setServices([...originalServices]);
    setFilteredServices([...originalServices]);
    setIsOrderChanged(false);
    toast.info('تم إلغاء التغييرات واستعادة الترتيب الأصلي');
  };

  const getImageSrc = (image: string) => {
    return `http://localhost:3001${image}`;
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const totalImages = filteredServices.reduce((acc, service) => acc + (service.detailedImages ? service.detailedImages.length : 0) + (service.mainImage ? 1 : 0), 0);
  const pieData = [
    { name: 'خدمات بصور', value: filteredServices.filter(s => s.detailedImages && s.detailedImages.length > 0).length },
    { name: 'خدمات بدون صور', value: filteredServices.filter(s => !s.detailedImages || s.detailedImages.length === 0).length },
  ];
  const barData = filteredServices.map(service => ({
    name: service.name,
    images: (service.detailedImages ? service.detailedImages.length : 0) + (service.mainImage ? 1 : 0)
  }));

  const mostVisitedService = visitData.reduce((max, item) => (item.visits > (max?.visits || 0) ? item : max), null as VisitData | null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 font-sans" dir="rtl">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.8s ease forwards;
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-slide-in {
            animation: slideIn 0.8s ease forwards;
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .animate-pulse {
            animation: pulse 2s infinite ease-in-out;
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .gradient-shift {
            background: linear-gradient(45deg, #10B981, #047857, #065F46, #10B981);
            background-size: 200% 200%;
            animation: gradientShift 8s ease infinite;
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-scale-in {
            animation: scaleIn 0.8s ease forwards;
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-100%); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-down {
            animation: slideDown 0.8s ease-out forwards;
          }
          @keyframes logoSpin {
            from { opacity: 0; transform: rotate(0deg) scale(0.5); }
            to { opacity: 1; transform: rotate(360deg) scale(1); }
          }
          .animate-logo-spin {
            animation: logoSpin 1s ease forwards;
          }
          @keyframes buttonShine {
            0% { background-position: -200%; }
            100% { background-position: 200%; }
          }
          .button-shine {
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            background-size: 200%;
            animation: buttonShine 2s infinite;
          }
          .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
          }
          .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
          }
          .glass-effect:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: scale(1.02);
          }
          .glow-effect {
            box-shadow: 0 0 20px rgba(52, 211, 153, 0.6);
          }
          .header-glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          }
          .header-button {
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .header-button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(52, 211, 153, 0.5);
          }
          .header-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s ease;
          }
          .header-button:hover::before {
            left: 100%;
          }
          .logo-container {
            background: #ffffff;
            border-radius: 50%;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
          }
          .logo-container:hover {
            transform: scale(1.1);
          }
          .stats-card {
            background: linear-gradient(145deg, rgba(52, 211, 153, 0.15), rgba(4, 120, 87, 0.15));
            border-radius: 16px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .stats-card:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
            background: linear-gradient(145deg, rgba(52, 211, 153, 0.25), rgba(4, 120, 87, 0.25));
          }
          .control-button::after {
            content: '';
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.15);
            transform: scaleX(0);
            transform-origin: right;
            transition: transform 0.3s ease;
          }
          .control-button:hover::after {
            transform: scaleX(1);
            transform-origin: left;
          }
          .spinner {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .modal-appear {
            animation: modalAppear 0.5s ease-out forwards;
          }
          @keyframes modalAppear {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .search-container {
            position: relative;
          }
          .search-icon {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #a0aec0;
            transition: color 0.3s ease;
          }
          .search-container input:focus + .search-icon {
            color: #34D399;
          }
          .dragging {
            opacity: 0.8;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
            transform: rotate(2deg);
            border: 2px dashed #34D399;
            background: rgba(52, 211, 153, 0.2);
            z-index: 1000;
          }
          .list-item {
            transition: all 0.3s ease;
          }
          .list-item:hover {
            background: rgba(52, 211, 153, 0.15);
            transform: translateX(5px);
          }
          .carousel-item {
            transition: transform 0.5s ease;
          }
          .carousel-item:hover {
            transform: scale(1.05);
          }
          .order-save-button {
            position: relative;
            overflow: hidden;
          }
          .order-save-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s ease;
          }
          .order-save-button:hover::before {
            left: 100%;
          }
          .draggable-container {
            position: relative;
            min-height: 200px;
          }
          .chart-container {
            position: relative;
            transition: all 0.3s ease;
            border-radius: 16px;
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1));
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          }
          .chart-container:hover {
            transform: scale(1.03);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.15));
          }
          .section-title {
            font-family: 'Tajawal', sans-serif;
            font-weight: 700;
            color: #E5E7EB;
            position: relative;
          }
          .section-title::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 3px;
            background: linear-gradient(to right, #34D399, #059669);
            border-radius: 2px;
          }
          .stats-icon {
            display: inline-block;
            margin-left: 8px;
            vertical-align: middle;
          }
          .gradient-text {
            background: linear-gradient(to right, #34D399, #059669);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
        `}
      </style>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable />

      <header className="gradient-shift text-white py-6 fixed top-0 left-0 right-0 z-50 header-glass animate-slide-down">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link
              to="/"
              className="header-button bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 glow-effect button-shine font-tajawal text-lg"
            >
              العودة للرئيسية
            </Link>
            <button
              onClick={handleLogout}
              className="header-button bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 glow-effect button-shine font-tajawal text-lg"
            >
              تسجيل الخروج
            </button>
          </div>
          <div className="logo-container animate-logo-spin">
            <img
              src={logo}
              alt="Site Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="section-title text-3xl font-bold animate-fade-in" style={{ animationDelay: '0.3s' }}>
            إدارة الخدمات
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-6 pt-24">
      <div className="mb-12 p-8 glass-effect rounded-2xl shadow-2xl animate-fade-in">
  <h2 className="section-title text-3xl font-bold text-white mb-8 tracking-wide flex items-center">
    إحصائيات الخدمات
    <svg className="w-8 h-8 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18v18H3zM9 3v18m6-18v18" />
    </svg>
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
    <div className="stats-card p-8 rounded-xl text-center glass-effect animate-scale-in">
      <p className="text-gray-200 text-xl font-tajawal mb-4 flex items-center justify-center">
        عدد الخدمات
        <svg className="stats-icon w-6 h-6 ml-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18v18H3zM9 3v18m6-18v18" />
        </svg>
      </p>
      <p className="text-5xl font-bold gradient-text font-tajawal">{filteredServices.length}</p>
    </div>
    <div className="stats-card p-8 rounded-xl text-center glass-effect animate-scale-in" style={{ animationDelay: '100ms' }}>
      <p className="text-gray-200 text-xl font-tajawal mb-4 flex items-center justify-center">
        إجمالي الصور
        <svg className="stats-icon w-6 h-6 ml-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4-4 4 4 4-4 4 4M4 8h16" />
        </svg>
      </p>
      <p className="text-5xl font-bold gradient-text font-tajawal">{totalImages}</p>
    </div>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="chart-container p-8 glass-effect rounded-2xl animate-scale-in flex flex-col items-center">
      <h3 className="section-title text-2xl mb-6 flex items-center">
        توزيع الخدمات
        <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        </svg>
      </h3>
      <PieChart width={350} height={300}>
        <defs>
          <linearGradient id="pieGradient1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="pieGradient2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          label // هنا الـ label بياخد boolean وده صح
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={1}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#pieGradient1)' : 'url(#pieGradient2)'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            color: '#E5E7EB',
            fontFamily: 'Tajawal',
            padding: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        />
        <Legend wrapperStyle={{ fontFamily: 'Tajawal', color: '#E5E7EB', paddingTop: '15px' }} />
      </PieChart>
    </div>
    <div className="chart-container p-8 glass-effect rounded-2xl animate-scale-in flex flex-col items-center" style={{ animationDelay: '100ms' }}>
      <h3 className="section-title text-2xl mb-6 flex items-center">
        عدد الصور لكل خدمة
        <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h6m-3 0v14m-9-7h18" />
        </svg>
      </h3>
      <BarChart width={450} height={300} data={barData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis dataKey="name" stroke="#ffffff" hide />
        <YAxis stroke="#E5E7EB" tick={{ fontFamily: 'Tajawal', fill: '#E5E7EB' }} />
        <Tooltip
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            color: '#E5E7EB',
            fontFamily: 'Tajawal',
            padding: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        />
        <Bar dataKey="images" fill="url(#barGradient)" />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </BarChart>
    </div>
  </div>
</div>

        <div className="mb-12 p-8 glass-effect rounded-2xl shadow-2xl animate-fade-in">
          <h2 className="section-title text-3xl font-bold text-white mb-8 tracking-wide flex items-center">
            إحصائيات زيارات الخدمات
            <svg className="w-8 h-8 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="stats-card p-8 rounded-xl text-center glass-effect animate-scale-in">
              <p className="text-gray-200 text-xl font-tajawal mb-4 flex items-center justify-center">
                إجمالي الزيارات
                <svg className="stats-icon w-6 h-6 ml-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </p>
              <p className="text-5xl font-bold gradient-text font-tajawal">
                {visitData.reduce((acc, item) => acc + item.visits, 0)}
              </p>
            </div>
            <div className="stats-card p-8 rounded-xl text-center glass-effect animate-scale-in" style={{ animationDelay: '100ms' }}>
              <p className="text-gray-200 text-xl font-tajawal mb-4 flex items-center justify-center">
                الخدمة الأكثر زيارة
                <svg className="stats-icon w-6 h-6 ml-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                </svg>
              </p>
              <p className="text-2xl font-bold gradient-text font-tajawal">
                {mostVisitedService ? `${mostVisitedService.name} (${mostVisitedService.visits} زيارة)` : 'لا توجد بيانات'}
              </p>
            </div>
          </div>
          <div className="chart-container p-8 glass-effect rounded-2xl animate-scale-in flex flex-col items-center">
            <h3 className="section-title text-2xl mb-6 flex items-center">
              عدد الزيارات لكل خدمة
              <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h6m-3 0v14m-9-7h18" />
              </svg>
            </h3>
            {visitData.length > 0 ? (
              <BarChart width={600} height={350} data={visitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#ffffff" hide />
                <YAxis stroke="#E5E7EB" tick={{ fontFamily: 'Tajawal', fill: '#E5E7EB' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)',
                    color: '#E5E7EB',
                    fontFamily: 'Tajawal',
                    padding: '10px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Bar dataKey="visits" fill="url(#visitGradient)" />
                <defs>
                  <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </BarChart>
            ) : (
              <p className="text-gray-200 text-center font-tajawal">لا توجد بيانات زيارات متاحة</p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 text-red-200 rounded-xl shadow-md animate-fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 text-green-200 rounded-xl shadow-md animate-fade-in">
            {success}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 glass-effect p-6 rounded-2xl shadow-2xl animate-fade-in">
          <div className="flex space-x-4 space-x-reverse">
            <Link
              to="/dashboard/add"
              className="relative control-button bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition-all duration-300 glow-effect transform hover:-translate-y-1 hover:scale-105"
            >
              إضافة خدمة جديدة
            </Link>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as 'grid' | 'list' | 'carousel')}
              className="p-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm hover:shadow-md transition-all duration-300 font-tajawal"
            >
              <option value="grid">عرض شبكي</option>
              <option value="list">عرض قائمة</option>
              <option value="carousel">عرض دائري</option>
            </select>
            {isOrderChanged && (
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={handleSaveOrder}
                  disabled={isSavingOrder}
                  className="relative order-save-button bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-6 py-3 rounded-lg hover:bg-yellow-800 transition-all duration-300 glow-effect transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 flex items-center font-tajawal"
                >
                  {isSavingOrder ? (
                    <>
                      <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner mr-2"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ الترتيب وطريقة العرض'
                  )}
                </button>
                <button
                  onClick={handleCancelChanges}
                  className="relative bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 glow-effect transform hover:-translate-y-1 hover:scale-105 font-tajawal"
                >
                  إلغاء التغييرات
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="search-container w-full md:w-64">
              <input
                type="text"
                placeholder="ابحث عن خدمة..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full p-3 pl-10 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm hover:shadow-md transition-all duration-300 font-tajawal"
              />
              <svg
                className="search-icon w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={sortOption}
              onChange={handleSortChange}
              className="p-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm hover:shadow-md transition-all duration-300 font-tajawal"
            >
              <option value="name-asc">ترتيب حسب الاسم (أ-ي)</option>
              <option value="name-desc">ترتيب حسب الاسم (ي-أ)</option>
              <option value="date-desc">الأحدث أولاً</option>
              <option value="date-asc">الأقدم أولاً</option>
            </select>
            <select
              value={filterOption}
              onChange={handleFilterChange}
              className="p-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm hover:shadow-md transition-all duration-300 font-tajawal"
            >
              <option value="all">جميع الخدمات</option>
              <option value="withImages">الخدمات التي تحتوي على صور</option>
              <option value="withoutImages">الخدمات بدون صور</option>
              <option value="moreThan5Images">خدمات بأكثر من 5 صور</option>
            </select>
          </div>
        </div>

        {filteredServices.length > 0 && displayMode !== 'carousel' && (
          <div className="mb-4 p-4 glass-effect rounded-xl text-gray-200 animate-fade-in font-tajawal">
            <p>
              لتغيير ترتيب الخدمات يدويًا: استخدم أزرار التحريك للأعلى (↑)، للأسفل (↓)، لليمين (→)، أو لليسار (←) لنقل الخدمة بين الصفوف أو ضمن نفس الصف. بعد ذلك، اضغط على زر "حفظ الترتيب وطريقة العرض" لتأكيد التغييرات.
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-6">
            <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full spinner"></div>
            <p className="mt-4 text-gray-300 font-tajawal">جاري التحميل...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-6 glass-effect p-6 rounded-xl shadow-lg">
            <p className="text-gray-300 text-lg font-tajawal">لا توجد خدمات لعرضها</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="services" direction={displayMode === 'list' ? 'vertical' : 'horizontal'}>
              {(provided: DroppableProvided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`draggable-container ${
                    displayMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6' : displayMode === 'list' ? 'space-y-6' : ''
                  }`}
                >
                  {displayMode === 'carousel' ? (
                    <Slider {...sliderSettings}>
                      {filteredServices.map((service, index) => (
                        <div key={service.id} className="px-2 carousel-item">
                          <div
                            className="glass-effect rounded-xl shadow-lg overflow-hidden relative group transform transition-all duration-500 card-hover animate-slide-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="relative mb-4">
                              {service.mainImage ? (
                                <img
                                  src={getImageSrc(service.mainImage)}
                                  alt={service.name}
                                  className="w-full h-48 object-cover rounded-t-xl transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-48 bg-gray-700 flex items-center justify-center rounded-t-xl">
                                  <span className="text-gray-300 font-tajawal">لا توجد صورة</span>
                                </div>
                              )}
                            </div>
                            <div className="p-6">
                              <h2 className="text-xl font-bold text-white mb-2 font-tajawal">{service.name}</h2>
                              <p className="text-gray-200 mb-4 truncate font-tajawal">{service.homeShortDescription}</p>
                              <div className="flex justify-between flex-wrap gap-2">
                                <Link
                                  to={`/dashboard/edit/${service.id}`}
                                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 font-tajawal"
                                >
                                  تعديل
                                </Link>
                                <button
                                  onClick={() => handleDelete(service.id)}
                                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 font-tajawal"
                                >
                                  حذف
                                </button>
                                <Link
                                  to={`/dashboard/${service.id}`}
                                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 font-tajawal"
                                >
                                  عرض التفاصيل
                                </Link>
                                <button
                                  onClick={() => handleImageStats(service.id)}
                                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all duration-300 font-tajawal"
                                >
                                  تحليل الصور
                                </button>
                              </div>
                            </div>
                            {imageStatsModal[service.id] && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-lg transition-opacity duration-700">
                                <div className="relative max-w-lg bg-gray-800 p-6 rounded-2xl shadow-2xl modal-appear">
                                  <h3 className="text-xl font-bold text-white mb-4 font-tajawal">إحصائيات الصور لـ {service.name}</h3>
                                  <p className="text-gray-200 font-tajawal">عدد الصور: {imageStatsModal[service.id]!.imageCount}</p>
                                  <p className="text-gray-200 font-tajawal">الحجم الكلي: {imageStatsModal[service.id]!.totalSizeMB} MB</p>
                                  {imageStatsModal[service.id]!.warning && (
                                    <p className="text-red-400 mt-2 font-tajawal">{imageStatsModal[service.id]!.warning}</p>
                                  )}
                                  <button
                                    onClick={() => setImageStatsModal(prev => ({ ...prev, [service.id]: undefined }))}
                                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 font-tajawal"
                                  >
                                    إغلاق
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </Slider>
                  ) : (
                    filteredServices.map((service, index) => (
                      <Draggable key={service.id} draggableId={service.id.toString()} index={index} isDragDisabled={false}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${
                              displayMode === 'list' ? 'list-item flex items-center glass-effect rounded-xl shadow-lg p-4' : 'glass-effect rounded-xl shadow-lg overflow-hidden'
                            } relative group transform transition-all duration-500 card-hover animate-slide-in ${snapshot.isDragging ? 'dragging' : ''}`}
                            style={{ animationDelay: `${index * 100}ms`, ...provided.draggableProps.style }}
                          >
                            <div className={`${displayMode === 'list' ? 'w-32 h-32 flex-shrink-0 mr-4' : 'relative mb-4'}`}>
                              {service.mainImage ? (
                                <img
                                  src={getImageSrc(service.mainImage)}
                                  alt={service.name}
                                  className={`${
                                    displayMode === 'list' ? 'w-full h-full object-cover rounded-lg' : 'w-full h-48 object-cover rounded-t-xl'
                                  } transition-transform duration-300 group-hover:scale-105`}
                                />
                              ) : (
                                <div
                                  className={`${
                                    displayMode === 'list' ? 'w-full h-full' : 'w-full h-48'
                                  } bg-gray-700 flex items-center justify-center rounded-lg`}
                                >
                                  <span className="text-gray-300 font-tajawal">لا توجد صورة</span>
                                </div>
                              )}
                            </div>
                            <div className="p-6 flex-1">
                              <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white mb-2 font-tajawal">{service.name}</h2>
                                {(displayMode === 'grid' || displayMode === 'list') && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => moveServiceUp(index)}
                                      disabled={index < getColumns()}
                                      className="bg-gray-500 text-white px-2 py-1 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-all"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      onClick={() => moveServiceDown(index)}
                                      disabled={index >= filteredServices.length - getColumns()}
                                      className="bg-gray-500 text-white px-2 py-1 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-all"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      onClick={() => moveServiceRight(index)}
                                      disabled={
                                        index >=
                                        Math.min(
                                          Math.floor(index / getColumns()) * getColumns() + getColumns() - 1,
                                          filteredServices.length - 1
                                        )
                                      }
                                      className="bg-gray-500 text-white px-2 py-1 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-all"
                                    >
                                      →
                                    </button>
                                    <button
                                      onClick={() => moveServiceLeft(index)}
                                      disabled={index <= Math.floor(index / getColumns()) * getColumns()}
                                      className="bg-gray-500 text-white px-2 py-1 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-all"
                                    >
                                      ←
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-200 mb-4 truncate font-tajawal">{service.homeShortDescription}</p>
                              <div className="flex justify-between flex-wrap gap-2">
                                <Link
                                  to={`/dashboard/edit/${service.id}`}
                                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 font-tajawal"
                                >
                                  تعديل
                                </Link>
                                <button
                                  onClick={() => handleDelete(service.id)}
                                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 font-tajawal"
                                >
                                  حذف
                                </button>
                                <Link
                                  to={`/dashboard/${service.id}`}
                                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 font-tajawal"
                                >
                                  عرض التفاصيل
                                </Link>
                                <button
                                  onClick={() => handleImageStats(service.id)}
                                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all duration-300 font-tajawal"
                                >
                                  تحليل الصور
                                </button>
                              </div>
                            </div>
                            {imageStatsModal[service.id] && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-lg transition-opacity duration-700">
                                <div className="relative max-w-lg bg-gray-800 p-6 rounded-2xl shadow-2xl modal-appear">
                                  <h3 className="text-xl font-bold text-white mb-4 font-tajawal">إحصائيات الصور لـ {service.name}</h3>
                                  <p className="text-gray-200 font-tajawal">عدد الصور: {imageStatsModal[service.id]!.imageCount}</p>
                                  <p className="text-gray-200 font-tajawal">الحجم الكلي: {imageStatsModal[service.id]!.totalSizeMB} MB</p>
                                  {imageStatsModal[service.id]!.warning && (
                                    <p className="text-red-400 mt-2 font-tajawal">{imageStatsModal[service.id]!.warning}</p>
                                  )}
                                  <button
                                    onClick={() => setImageStatsModal(prev => ({ ...prev, [service.id]: undefined }))}
                                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 font-tajawal"
                                  >
                                    إغلاق
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
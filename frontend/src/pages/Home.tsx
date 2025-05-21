import React, { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Phone, Clock, Shield, Award, ThumbsUp, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load components that aren't immediately visible
const ContactFooter = lazy(() => import('../components/ContactFooter'));
const ImageSlider = lazy(() => import('../components/ImageSlider'));
 
// استيراد صور الهيرو
import b1 from '../assets/b2.png';
import b2 from '../assets/b1.png';
import b3 from '../assets/b3.png';
import b4 from '../assets/b4.png';

const heroImages = [b1, b2, b3, b4];

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
  features: string[];
}

// تعريف المميزات ولماذا تختارنا
interface Feature {
  icon: JSX.Element;
  title: string;
  description: string;
}

interface WhyChooseUsItem {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Star className="text-green-600 w-8 h-8" />,
    title: 'خدمة عالية الجودة',
    description: 'نقدم أعلى معايير الجودة العالمية في جميع خدماتنا بدون أي تنازل'
  },
  {
    icon: <Clock className="text-green-600 w-8 h-8" />,
    title: 'سرعة في التنفيذ',
    description: 'نلتزم بالمواعيد المحددة ونقدم خدماتنا بسرعة وكفاءة عالية'
  },
  {
    icon: <Phone className="text-green-600 w-8 h-8" />,
    title: 'دعم على مدار الساعة',
    description: 'فريق خدمة العملاء جاهز للرد على استفساراتكم في أي وقت طوال اليوم'
  },
  {
    icon: <Sparkles className="text-green-600 w-8 h-8" />,
    title: 'حلول النظافة الراقية',
    description: 'خدمات نظافة متقدمة تجمع بين الجودة، الاحترافية، وأحدث التقنيات'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 5.5L4.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16.5 5.5L19.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'نهتم بالتفاصيل',
    description: 'تعكس التزامنا بالجودة والدقة في كل جانب من خدماتنا'
  },
  {
    icon: <Shield className="text-green-600 w-8 h-8" />,
    title: 'مواد آمنة',
    description: 'نستخدم منتجات تنظيف عالية الجودة وآمنة مع فعالية قصوى'
  }
];

const whyChooseUs: WhyChooseUsItem[] = [
  {
    icon: <Award className="w-12 h-12 mb-4 text-white" />,
    title: 'فريق محترف',
    description: 'نخبة من المتخصصين ذوي الخبرة والكفاءة العالية'
  },
  {
    icon: <Shield className="w-12 h-12 mb-4 text-white" />,
    title: 'معدات متطورة',
    description: 'نستثمر في أحدث المعدات والتقنيات العالمية'
  },
  {
    icon: <ThumbsUp className="w-12 h-12 mb-4 text-white" />,
    title: 'أسعار تنافسية',
    description: 'أسعار مدروسة مع ضمان أعلى مستويات الجودة'
  }
];

interface SectionRefs {
  services: React.RefObject<HTMLDivElement>;
  features: React.RefObject<HTMLDivElement>;
  whyChooseUs: React.RefObject<HTMLDivElement>;
}

function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState({
    services: false,
    features: false,
    whyChooseUs: false
  });
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list' | 'carousel'>('grid');
  const [serverAvailable, setServerAvailable] = useState<boolean>(true);

  // جلب الخدمات من الخادم
  useEffect(() => {
    fetchServices();
    // استرجاع طريقة العرض من localStorage
    const savedMode = localStorage.getItem('displayMode') as 'grid' | 'list' | 'carousel';
    if (savedMode) {
      setDisplayMode(savedMode);
    }
  }, []);

  const fetchServices = () => {
    setLoading(true);
    fetch('http://localhost:3001/api/services')
      .then(response => {
        if (!response.ok) {
          setServerAvailable(false);
          throw new Error('فشل في جلب الخدمات');
        }
        return response.json();
      })
      .then(data => {
        // استرجاع الترتيب المحفوظ من localStorage
        const savedOrder = localStorage.getItem('servicesOrder');
        let sortedData = data as Service[];
        if (savedOrder) {
          const orderedIds = JSON.parse(savedOrder) as number[];
          sortedData = orderedIds
            .map(id => data.find((service: Service) => service.id === id))
            .filter((service): service is Service => service !== undefined);
          // إضافة خدمات جديدة غير موجودة في الترتيب
          const existingIds = new Set(orderedIds);
          sortedData = [
            ...sortedData,
            ...data.filter((service: Service) => !existingIds.has(service.id))
          ];
        }
        setServices(sortedData);
        setLoading(false);
        setServerAvailable(true);
      })
      .catch(error => {
        setError(error.message || 'حدث خطأ أثناء جلب الخدمات');
        toast.error(error.message || 'حدث خطأ أثناء جلب الخدمات');
        setLoading(false);
        setServerAvailable(false);
      });
  };

  // دالة لتتبع زيارات الخدمة
  const trackVisit = (serviceId: number) => {
    const visits = JSON.parse(localStorage.getItem('serviceVisits') || '{}');
    visits[serviceId] = (visits[serviceId] || 0) + 1;
    localStorage.setItem('serviceVisits', JSON.stringify(visits));
  };

  // مراجع الأقسام
  const sectionsRef: SectionRefs = {
    services: useRef<HTMLDivElement>(null),
    features: useRef<HTMLDivElement>(null),
    whyChooseUs: useRef<HTMLDivElement>(null)
  };

  const scrollToServices = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (sectionsRef.services.current) {
      sectionsRef.services.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // تحميل الهيرو
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // مراقبة ظهور الأقسام
  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            const sectionId = entry.target.dataset.section;
            if (sectionId && (sectionId === 'services' || sectionId === 'features' || sectionId === 'whyChooseUs')) {
              setVisibleSections(prev => ({
                ...prev,
                [sectionId]: true
              }));
              sectionObserver.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    Object.entries(sectionsRef).forEach(([key, ref]) => {
      if (ref.current) {
        if (ref.current instanceof HTMLElement) {
          ref.current.dataset.section = key;
          sectionObserver.observe(ref.current);
        }
      }
    });

    return () => {
      sectionObserver.disconnect();
    };
  }, []);

  const getImageSrc = (image: string) => {
    return `http://localhost:3001${image}`;
  };

  // إعدادات السلايدر للكروسيل
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

  // الأنميشنات
  const animationStyles = `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    @keyframes subtleGlow {
      0% { box-shadow: 0 0 3px rgba(0, 0, 0, 0.1); }
      50% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
      100% { box-shadow: 0 0 3px rgba(0, 0, 0, 0.1); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.6s ease forwards;
    }
    .animate-slide-in {
      animation: slideIn 0.6s ease forwards;
    }
    .shimmer-effect::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      animation: shimmer 2s infinite;
    }
    .pulse-effect {
      animation: pulse 3s infinite ease-in-out;
    }
    .glow-effect {
      animation: subtleGlow 2s infinite ease-in-out;
    }
    .list-item {
      transition: all 0.3s ease;
    }
    .list-item:hover {
      background: rgba(16, 185, 129, 0.15);
      transform: translateX(-5px);
    }
    .carousel-item {
      transition: transform 0.5s ease;
    }
    .carousel-item:hover {
      transform: scale(1.05);
    }
    .glass-effect {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .gradient-button::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #10b981, #059669);
      z-index: -1;
      border-radius: 10px;
      filter: blur(8px);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .gradient-button:hover::before {
      opacity: 1;
    }
  `;

  return (
    <div className="ltr bg-gray-50">
      <style>{animationStyles}</style>
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable />

      {/* التنقل */}
      <Navbar />

      {/* قسم الهيرو */}
      <div className="w-full h-[400px] md:h-[600px] relative overflow-hidden">
        <Suspense fallback={<div className="w-full h-full bg-gray-200"></div>}>
          <ImageSlider images={heroImages} />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/20 flex flex-col items-center justify-center text-white px-4">
          <h1 
            className={`text-4xl md:text-6xl font-bold mb-6 text-center transition-all duration-300 pulse-effect ${
              heroLoaded ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-10'
            }`}
          >
            شركة مواسم الخدمات
          </h1>
          <p 
            className={`text-lg md:text-2xl max-w-2xl text-center mb-8 transition-all duration-300 delay-150 pulse-effect ${
              heroLoaded ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-10'
            }`}
          >
            حلول راقية لنظافة الفلل والقصور والفنادق والمولات
          </p>
          <div 
            className={`flex flex-wrap justify-center gap-4 transition-all duration-300 delay-200 glow-effect ${
              heroLoaded ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'
            }`}
          >
            <a 
              href="#services" 
              onClick={scrollToServices} 
              className="relative gradient-button bg-gradient-to-r from-green-600 to-green-800 text-white py-4 px-10 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
            >
              خدماتنا
            </a>
          </div>
        </div>
      </div>

      {/* تحذير لو الخادم مش متاح */}
      {!serverAvailable && (
        <div className="container mx-auto px-6 py-4">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center">
            تحذير: الخادم غير متاح حاليًا. البيانات معروضة بناءً على التخزين المحلي.
          </div>
        </div>
      )}

      {/* قسم المميزات */}
      <div className="bg-white py-16" ref={sectionsRef.features}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 
              className={`text-4xl font-bold mb-4 text-gray-800 transition-all duration-500 pulse-effect ${
                visibleSections.features ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-10'
              }`}
            >
              مميزاتنا
              <span className={`block h-1 w-24 bg-green-600 mx-auto mt-4 transition-all duration-500 delay-200 ${
                visibleSections.features ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`}></span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`flex flex-col items-center text-center p-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 glass-effect ${
                  visibleSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 transform transition-transform duration-300 hover:rotate-12">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* قسم الخدمات */}
      <div id="services" ref={sectionsRef.services} className="container mx-auto px-6 py-24">
        <div className={`text-center mb-16 transition-all duration-500 ${
          visibleSections.services ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 text-gray-800 inline-block relative pulse-effect">
            خدماتنا
            <span className={`block h-1 w-24 bg-green-600 mx-auto mt-4 transition-all duration-500 delay-200 shimmer-effect ${
              visibleSections.services ? 'w-24' : 'w-0'
            }`}></span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mt-4">
            مجموعة متكاملة من خدمات التنظيف والصيانة عالية الجودة
          </p>
        </div>

        {error && (
          <div className="text-center mb-4 p-4 bg-red-500/20 text-red-200 rounded-xl glass-effect animate-fade-in">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-6 pulse-effect">
            <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-6 glass-effect p-6 rounded-xl shadow-lg animate-fade-in">
            <p className="text-gray-600 text-lg">لا توجد خدمات لعرضها</p>
          </div>
        ) : (
          <div className={displayMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8' : displayMode === 'list' ? 'space-y-6' : ''}>
            {displayMode === 'carousel' ? (
              <Slider {...sliderSettings}>
                {services.map((service, index) => (
                  <div key={service.id} className="px-2 carousel-item">
                    <Link
                      to={`/service/${service.id}`}
                      onClick={() => trackVisit(service.id)} // تتبع الزيارة
                      className="glass-effect rounded-xl shadow-lg overflow-hidden group relative flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:border-green-200 glow-effect animate-slide-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="h-56 overflow-hidden relative bg-gray-100">
                        {service.mainImage ? (
                          <img
                            src={getImageSrc(service.mainImage)}
                            alt={service.name}
                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                            loading="lazy"
                            width="300"
                            height="200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Star className="w-8 h-8 text-gray-400 pulse-effect" />
                          </div>
                        )}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-green-700/30 to-teal-900/50 transition-all duration-300 shimmer-effect"></div>
                      </div>
                      <div className="p-6 flex-grow text-left">
                        <div className="relative inline-block mb-3">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition-colors duration-300">
                            {service.name}
                          </h3>
                          <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-green-500 transition-all duration-500 shimmer-effect"></div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{service.homeShortDescription}</p>
                      </div>
                      <div className="mt-auto">
                        <div className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 transition-all duration-300 relative overflow-hidden">
                          <div className="py-4 px-6 flex items-center justify-between relative z-10">
                            <span className="font-medium text-white text-base">استكشف الخدمة</span>
                            <div className="w-8 h-8 rounded-full bg-green-600 shadow-md flex items-center justify-center transform group-hover:-translate-x-2 transition-all duration-300">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-white transform rotate-180 transition-transform duration-300 group-hover:rotate-90"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                          <span className="absolute inset-0 bg-green-700/50 transform translate-x-full group-hover:-translate-x-0 transition-transform duration-500 shimmer-effect"></span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </Slider>
            ) : (
              services.map((service, index) => (
                <Link
                  key={service.id}
                  to={`/service/${service.id}`}
                  onClick={() => trackVisit(service.id)} // تتبع الزيارة
                  className={`${
                    displayMode === 'list' ? 'list-item flex items-center glass-effect rounded-xl shadow-lg p-4' : 'glass-effect rounded-xl shadow-lg overflow-hidden'
                  } group relative flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:border-green-200 glow-effect animate-slide-in`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-teal-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 shimmer-effect"></div>
                  <div className={`${displayMode === 'list' ? 'w-32 h-32 flex-shrink-0 ml-4' : 'h-56 overflow-hidden'} relative bg-gray-100`}>
                    {service.mainImage ? (
                      <img
                        src={getImageSrc(service.mainImage)}
                        alt={service.name}
                        className={`${
                          displayMode === 'list' ? 'w-full h-full object-cover rounded-lg' : 'w-full h-full object-cover'
                        } transition-all duration-500 group-hover:scale-110`}
                        loading="lazy"
                        width="300"
                        height="200"
                      />
                    ) : (
                      <div className={`${displayMode === 'list' ? 'w-full h-full' : 'w-full h-full'} flex items-center justify-center bg-gray-200`}>
                        <Star className="w-8 h-8 text-gray-400 pulse-effect" />
                      </div>
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-green-700/30 to-teal-900/50 transition-all duration-300 shimmer-effect"></div>
                  </div>
                  <div className="p-6 flex-grow text-left">
                    <div className="relative inline-block mb-3">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition-colors duration-300">
                        {service.name}
                      </h3>
                      <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-green-500 transition-all duration-500 shimmer-effect"></div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{service.homeShortDescription}</p>
                  </div>
                  <div className="mt-auto">
                    <div className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 transition-all duration-300 relative overflow-hidden">
                      <div className="py-4 px-6 flex items-center justify-between relative z-10">
                        <span className="font-medium text-white text-base">استكشف الخدمة</span>
                        <div className="w-8 h-8 rounded-full bg-green-600 shadow-md flex items-center justify-center transform group-hover:-translate-x-2 transition-all duration-300">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-white transform rotate-180 transition-transform duration-300 group-hover:rotate-90"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <span className="absolute inset-0 bg-green-700/50 transform translate-x-full group-hover:-translate-x-0 transition-transform duration-500 shimmer-effect"></span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Why Choose Us section */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white py-24 relative overflow-hidden" ref={sectionsRef.whyChooseUs}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-0 top-0 w-96 h-96 rounded-full bg-white/10 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute right-0 bottom-0 w-96 h-96 rounded-full bg-white/10 translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-16 transition-all duration-500 ${
            visibleSections.whyChooseUs ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-10'
          }`}>
            <h2 className="text-4xl font-bold mb-4">لماذا تختارنا؟</h2>
            <div className={`h-1 w-20 bg-white mx-auto mb-6 transition-all duration-500 delay-200 ${
              visibleSections.whyChooseUs ? 'w-20' : 'w-0'
            }`}></div>
            <p className="text-xl max-w-2xl mx-auto">
              نسعى دائماً لتقديم أفضل خدمات التنظيف والصيانة بأعلى المعايير العالمية وبأسعار تنافسية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseUs.map((item, index) => (
              <div 
                key={index} 
                className={`group bg-white/10 backdrop-blur-sm p-8 rounded-xl transition-all duration-300 hover:bg-white/20 flex flex-col items-center text-center transform hover:-translate-y-2 hover:shadow-xl ${
                  visibleSections.whyChooseUs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
                style={{ transitionDelay: `${Math.min(index * 100, 300)}ms` }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/30 rounded-full scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 mt-2">{item.title}</h3>
                <p className="transform group-hover:translate-y-1 transition-transform duration-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* الفوتر */}
      <Suspense fallback={<div className="bg-gray-900 h-64"></div>}>
        <ContactFooter />
      </Suspense>
    </div>
  );
}

export default Home;
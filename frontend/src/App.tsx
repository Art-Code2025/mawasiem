import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// تعريف نوع الخدمة
interface Service {
  id: number;
  name: string;
  shortDescription: string;
  images: string[];
}

const App: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/services')
      .then(response => response.json())
      .then(data => setServices(data))
      .catch(error => console.error('Error fetching services:', error));
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans" dir="rtl">
      <header className="bg-white text-center py-6">
        <h1 className="text-3xl font-bold text-black">الخدمات المقدمة من مواسم</h1>
      </header>
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-gray-100 rounded-lg shadow-md overflow-hidden">
              <img src={`http://localhost:3001${service.images[0]}`} alt={service.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h2 className="text-xl font-semibold text-black">{service.name}</h2>
                <p className="text-gray-600 mt-2">{service.shortDescription}</p>
                <Link to={`/service/${service.id}`} className="inline-block mt-4 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
                  استعلام عن الخدمة
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link to="/login" className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
            الذهاب إلى الداشبورد
          </Link>
        </div>
      </main>
    </div>
  );
};

export default App;
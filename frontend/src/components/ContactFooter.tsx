import React from 'react';
import { Phone, Mail, MapPin, ExternalLink, Users, Headphones, UserCheck } from 'lucide-react';

const ContactSection = () => {
  const openGoogleMaps = () => {
    window.open(
      "https://www.google.com/maps/place/24%C2%B045'04.5%22N+46%C2%B043'12.1%22E/@24.7512609,46.7200274,17z",
      "_blank"
    );
  };

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-green-800 mb-2">تواصل معنا</h2>
          <div className="w-20 h-1 bg-green-600 mx-auto mb-3 rounded-full"></div>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm">نحن دائماً في خدمتكم. يمكنكم التواصل معنا من خلال أي من الوسائل التالية</p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Location Card */}
          <div 
            className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
            onClick={openGoogleMaps}
          >
            <div className="bg-green-600 h-2 w-full group-hover:bg-green-500 transition-colors"></div>
            <div className="p-5">
              <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <MapPin className="w-7 h-7 text-green-600" />
              </div>
              
              <h3 className="text-lg font-bold text-center text-green-800 mb-2">الموقع الحالي</h3>
              
              <div className="text-center">
                <p className="text-gray-700 text-sm mb-3">طريق الملك عبدالله، المملكة العربية السعودية</p>
                <button className="mx-auto flex items-center justify-center text-green-600 font-medium hover:text-green-700 transition-colors bg-green-50 py-1.5 px-3 rounded-lg hover:bg-green-100 text-sm">
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  <span>افتح في الخريطة</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Email Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <div className="bg-green-600 h-2 w-full group-hover:bg-green-500 transition-colors"></div>
            <div className="p-5">
              <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              
              <h3 className="text-lg font-bold text-center text-green-800 mb-3">البريد الإلكتروني</h3>
              
              <div className="w-full">
                <a href="mailto:info@mawasims.com.sa" 
                   className="flex items-center justify-center space-x-1 space-x-reverse py-2 px-2 rounded-md hover:bg-green-50 transition-colors mb-1 border border-gray-100">
                  <Users className="w-4 h-4 text-green-600 ml-1.5" />
                  <span className="text-gray-700 hover:text-green-700 transition-colors text-sm">info@mawasims.com.sa</span>
                </a>
              </div>
            </div>
          </div>
          
          {/* Phone Numbers Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <div className="bg-green-600 h-2 w-full group-hover:bg-green-500 transition-colors"></div>
            <div className="p-5">
              <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Phone className="w-7 h-7 text-green-600" />
              </div>
              
              <h3 className="text-lg font-bold text-center text-green-800 mb-2">أرقام الجوال</h3>
              
              <div className="w-full">
                <div className="text-center mb-1">
                  <div className="inline-flex items-center justify-center bg-green-100 px-2 py-0.5 rounded-full mb-1">
                    <Headphones className="w-3.5 h-3.5 text-green-600 ml-1" />
                    <span className="text-green-700 font-medium text-xs">خدمة العملاء</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {["0563995580", "0502116888", "0547493606"].map((phone, index) => (
                    <a key={index} href={`tel:${phone}`} 
                       className="flex items-center justify-center py-1.5 rounded-md hover:bg-green-50 transition-colors border border-gray-100">
                      <span className="text-gray-700 hover:text-green-700 transition-colors font-medium text-sm">{phone}</span>
                    </a>
                  ))}
                </div>
                
                <div className="border-t border-green-100 pt-2 mt-2">
                  <div className="text-center mb-1">
                    <div className="inline-flex items-center justify-center bg-green-100 px-2 py-0.5 rounded-full mb-1">
                      <Users className="w-3.5 h-3.5 text-green-600 ml-1" />
                      <span className="text-green-700 font-medium text-xs">أرقام الإدارة</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-center">
                      <p className="text-green-700 font-medium text-xs mb-1">مدير الفرع</p>
                      <a href="tel:0502532888" 
                         className="flex items-center justify-center py-1.5 rounded-md hover:bg-green-50 transition-colors border border-gray-100">
                        <span className="text-gray-700 hover:text-green-700 transition-colors text-sm">0502532888</span>
                      </a>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-green-700 font-medium text-xs mb-1">مدير إدارة المشاريع</p>
                      <a href="tel:0505242177" 
                         className="flex items-center justify-center py-1.5 rounded-md hover:bg-green-50 transition-colors border border-gray-100">
                        <span className="text-gray-700 hover:text-green-700 transition-colors text-sm">0505242177</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Professional Look */}
      <footer className="py-2 bg-white border-t border-gray-100 text-center">
        <a 
          href="https://www.instagram.com/artc.ode39?igsh=OG0xOGltcmM0djV6" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-600 text-xs font-medium hover:text-green-600 transition-colors"
        >
          ArtCode-2025
        </a>
      </footer>
    </div>
  );
};

export default ContactSection;
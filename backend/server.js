import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// محاكاة __dirname في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// إعدادات Multer لرفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public/images/');
    fs.mkdir(dir, { recursive: true })
      .then(() => cb(null, dir))
      .catch(err => cb(err, dir));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// تعريف Multer مع الحقول المتوقعة وحدود الحجم
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 16
  }
}).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'detailedImages', maxCount: 15 },
]);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// مسار ملف services.json
const servicesFilePath = path.join(__dirname, 'services.json');

// التأكد من وجود ملف services.json
const initializeServicesFile = async () => {
  try {
    await fs.access(servicesFilePath);
  } catch (error) {
    console.log('services.json does not exist, creating it...');
    await fs.writeFile(servicesFilePath, JSON.stringify([], null, 2));
  }
};

// قراءة الخدمات من services.json
async function readServices() {
  try {
    const data = await fs.readFile(servicesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading services:', error);
    return [];
  }
}

// كتابة الخدمات إلى services.json
async function writeServices(services) {
  try {
    await fs.writeFile(servicesFilePath, JSON.stringify(services, null, 2));
  } catch (error) {
    console.error('Error writing services:', error);
    throw error;
  }
}

// جلب كل الخدمات
app.get('/api/services', async (req, res) => {
  try {
    const services = await readServices();
    res.json(services);
  } catch (error) {
    console.error('Error in GET /api/services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

// جلب خدمة محددة بناءً على الـ ID
app.get('/api/services/:id', async (req, res) => {
  try {
    const services = await readServices();
    const service = services.find(s => s.id === parseInt(req.params.id));
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    console.error('Error in GET /api/services/:id:', error);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
});

// إحصائيات الصور لخدمة معينة
app.get('/api/services/:id/images-stats', async (req, res) => {
  try {
    const services = await readServices();
    const serviceId = parseInt(req.params.id);
    const service = services.find(s => s.id === serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    let totalSize = 0;
    const imagePaths = [];

    // حجم الصورة الرئيسية
    if (service.mainImage) {
      const mainImagePath = path.join(__dirname, 'public', service.mainImage);
      imagePaths.push(mainImagePath);
    }

    // حجم الصور التفصيلية
    if (service.detailedImages && service.detailedImages.length > 0) {
      service.detailedImages.forEach(image => {
        const imagePath = path.join(__dirname, 'public', image);
        imagePaths.push(imagePath);
      });
    }

    // جمع أحجام الصور
    for (const imagePath of imagePaths) {
      try {
        const stats = await fs.stat(imagePath);
        totalSize += stats.size;
      } catch (error) {
        console.error(`Error getting size for ${imagePath}:`, error);
      }
    }

    // تحويل الحجم إلى MB
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    res.json({
      imageCount: (service.mainImage ? 1 : 0) + (service.detailedImages ? service.detailedImages.length : 0),
      totalSizeMB: parseFloat(totalSizeMB),
      warning: totalSizeMB > 2 ? 'تحذير: الحجم الكلي للصور كبير جدًا (أكثر من 2 MB)' : null
    });
  } catch (error) {
    console.error('Error in GET /api/services/:id/images-stats:', error);
    res.status(500).json({ message: 'Failed to fetch image stats', error: error.message });
  }
});

// إضافة خدمة جديدة
app.post('/api/services', (req, res, next) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'خطأ في رفع الملفات', error: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'خطأ غير متوقع', error: err.message });
    }

    try {
      const services = await readServices();
      const { name, homeShortDescription, detailsShortDescription, description, imageDetails, features } = req.body;

      console.log('Received data:', { name, homeShortDescription, detailsShortDescription, description, imageDetails, features });
      console.log('Received files:', req.files);

      const parsedImageDetails = JSON.parse(imageDetails || '[]');
      const parsedFeatures = JSON.parse(features || '[]');

      const mainImage = req.files['mainImage'] ? `/images/${req.files['mainImage'][0].filename}` : '';
      const detailedImages = req.files['detailedImages']
        ? req.files['detailedImages'].map(file => `/images/${file.filename}`)
        : [];

      const newService = {
        id: services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1,
        name,
        homeShortDescription,
        detailsShortDescription,
        description,
        mainImage,
        detailedImages,
        imageDetails: parsedImageDetails,
        features: parsedFeatures,
        createdAt: new Date().toISOString()
      };

      services.push(newService);
      await writeServices(services);
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error in POST /api/services:', error);
      res.status(500).json({ message: 'Failed to add service', error: error.message });
    }
  });
});

// تعديل خدمة موجودة
app.put('/api/services/:id', (req, res, next) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'خطأ في رفع الملفات', error: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'خطأ غير متوقع', error: err.message });
    }

    try {
      const services = await readServices();
      const serviceId = parseInt(req.params.id);
      const serviceIndex = services.findIndex(s => s.id === serviceId);

      if (serviceIndex === -1) {
        return res.status(404).json({ message: 'Service not found' });
      }

      const { name, homeShortDescription, detailsShortDescription, description, imageDetails, features } = req.body;

      console.log('Received data for update:', { name, homeShortDescription, detailsShortDescription, description, imageDetails, features });
      console.log('Received files for update:', req.files);

      const parsedImageDetails = JSON.parse(imageDetails || '[]');
      const parsedFeatures = JSON.parse(features || '[]');

      const mainImage = req.files['mainImage']
        ? `/images/${req.files['mainImage'][0].filename}`
        : services[serviceIndex].mainImage;

      const detailedImages = req.files['detailedImages']
        ? req.files['detailedImages'].map(file => `/images/${file.filename}`)
        : services[serviceIndex].detailedImages;

      const updatedService = {
        ...services[serviceIndex],
        name: name || services[serviceIndex].name,
        homeShortDescription: homeShortDescription || services[serviceIndex].homeShortDescription,
        detailsShortDescription: detailsShortDescription || services[serviceIndex].detailsShortDescription,
        description: description || services[serviceIndex].description,
        mainImage,
        detailedImages,
        imageDetails: parsedImageDetails.length > 0 ? parsedImageDetails : services[serviceIndex].imageDetails,
        features: parsedFeatures.length > 0 ? parsedFeatures : services[serviceIndex].features,
        updatedAt: new Date().toISOString()
      };

      services[serviceIndex] = updatedService;
      await writeServices(services);
      res.json(updatedService);
    } catch (error) {
      console.error('Error in PUT /api/services/:id:', error);
      res.status(500).json({ message: 'Failed to update service', error: error.message });
    }
  });
});

// تحديث ترتيب الخدمات
app.put('/api/services/reorder', async (req, res) => {
  try {
    const { reorderedServices } = req.body;
    await writeServices(reorderedServices);
    res.json({ message: 'Services reordered successfully' });
  } catch (error) {
    console.error('Error in PUT /api/services/reorder:', error);
    res.status(500).json({ message: 'Failed to reorder services', error: error.message });
  }
});

// حذف خدمة
app.delete('/api/services/:id', async (req, res) => {
  try {
    const services = await readServices();
    const serviceId = parseInt(req.params.id);
    const updatedServices = services.filter(s => s.id !== serviceId);

    if (services.length === updatedServices.length) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await writeServices(updatedServices);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/services/:id:', error);
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
});

// التأكد من وجود ملف services.json عند بدء تشغيل السيرفر
initializeServicesFile().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch(error => {
  console.error('Failed to initialize services file:', error);
  process.exit(1);
});
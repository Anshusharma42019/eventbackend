const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dwwmfekwf',
  api_key: '788782796555477',
  api_secret: '8Rv8gOym0lgTiGTBbi4rhVXspEg'
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.uploadImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      res.json({ url: result.secure_url });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: error.message });
    }
  }
];
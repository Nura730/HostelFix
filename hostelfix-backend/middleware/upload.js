const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Cloudinary config (optional - only if env vars are set)
let cloudinaryStorage = null;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinary = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "hostelfix",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    },
  });
}

// Local storage fallback
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `complaint-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images allowed"), false);
  }
};

// Create multer instance
const upload = multer({
  storage: cloudinaryStorage || localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// Helper to get image URL
const getImageUrl = (file) => {
  if (!file) return null;

  // Cloudinary URL
  if (file.path && file.path.startsWith("http")) {
    return file.path;
  }

  // Local URL
  return `/uploads/${file.filename}`;
};

// Helper to delete image
const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    // Cloudinary image
    if (imageUrl.includes("cloudinary")) {
      const cloudinary = require("cloudinary").v2;
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`hostelfix/${publicId}`);
    } else {
      // Local image
      const filename = imageUrl.replace("/uploads/", "");
      const filePath = path.join(__dirname, "..", "uploads", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error("Error deleting image:", err);
  }
};

module.exports = { upload, getImageUrl, deleteImage };

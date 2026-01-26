const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      msg: "File too large. Maximum size is 5MB",
    });
  }

  // Multer file type error
  if (err.message === "Only images allowed") {
    return res.status(400).json({
      success: false,
      msg: "Only JPEG and PNG images are allowed",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      msg: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      msg: "Token expired. Please login again",
    });
  }

  // MySQL errors
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(400).json({
      success: false,
      msg: "Duplicate entry. This record already exists",
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message;

  res.status(statusCode).json({
    success: false,
    msg: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };

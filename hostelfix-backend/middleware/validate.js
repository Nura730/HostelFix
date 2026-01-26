const { body, param, query, validationResult } = require("express-validator");

// Validation result checker
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      msg: "Validation failed",
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

// Common validation rules
const rules = {
  // Auth validations
  login: [
    body("college_id")
      .trim()
      .notEmpty()
      .withMessage("College ID is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("College ID must be 3-50 characters"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],

  register: [
    body("college_id")
      .trim()
      .notEmpty()
      .withMessage("College ID is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("College ID must be 3-50 characters"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/\d/)
      .withMessage("Password must contain a number"),
    body("name")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Name too long"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),
  ],

  // Complaint validations
  complaint: [
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Complaint message is required")
      .isLength({ min: 10, max: 500 })
      .withMessage("Message must be 10-500 characters"),
    body("priority")
      .optional()
      .isIn(["normal", "urgent"])
      .withMessage("Priority must be normal or urgent"),
  ],

  updateStatus: [
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["pending", "approved", "rejected", "in_progress"])
      .withMessage("Invalid status value"),
    body("comment")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Comment too long"),
  ],

  // User creation validations
  createUser: [
    body("college_id").trim().notEmpty().withMessage("College ID is required"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(["student", "caretaker", "admin"])
      .withMessage("Invalid role"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").optional().isEmail().withMessage("Invalid email"),
    body("mobile")
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage("Invalid mobile number"),
    body("hostel")
      .optional()
      .isIn(["boys", "girls"])
      .withMessage("Hostel must be boys or girls"),
  ],

  // OTP validations
  sendOtp: [
    body("college_id").trim().notEmpty().withMessage("College ID is required"),
  ],

  resetPassword: [
    body("college_id").trim().notEmpty().withMessage("College ID is required"),
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],

  // ID param validation
  idParam: [param("id").isInt({ min: 1 }).withMessage("Invalid ID")],
};

module.exports = { validate, rules, body, param, query };

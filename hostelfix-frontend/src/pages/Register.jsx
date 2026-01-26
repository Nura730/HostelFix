import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api, { getErrorMessage } from "../api/api";
import {
  FaUser,
  FaLock,
  FaEnvelope,
  FaArrowLeft,
  FaIdCard,
} from "react-icons/fa";
import "./login.css";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    college_id: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.college_id.trim()) {
      return toast.error("College ID is required");
    }

    if (!formData.name.trim()) {
      return toast.error("Name is required");
    }

    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords don't match");
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return toast.error("Invalid email format");
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        college_id: formData.college_id,
        password: formData.password,
        name: formData.name,
        email: formData.email || undefined,
      });

      toast.success("Registration successful! Please login.");
      navigate("/");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginCard registerCard">
        <Link to="/" className="backLink">
          <FaArrowLeft /> Back to Login
        </Link>

        <h2>📝 Register</h2>
        <p className="subtitle">Create your student account</p>

        <form onSubmit={handleSubmit}>
          <div className="inputGroup">
            <FaIdCard className="inputIcon" />
            <input
              type="text"
              name="college_id"
              placeholder="College ID *"
              value={formData.college_id}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="inputGroup">
            <FaUser className="inputIcon" />
            <input
              type="text"
              name="name"
              placeholder="Full Name *"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="inputGroup">
            <FaEnvelope className="inputIcon" />
            <input
              type="email"
              name="email"
              placeholder="Email (for password recovery)"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="inputGroup">
            <FaLock className="inputIcon" />
            <input
              type="password"
              name="password"
              placeholder="Password * (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="inputGroup">
            <FaLock className="inputIcon" />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password *"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="note">
          * Complete your profile after login or contact admin for room
          assignment.
        </p>
      </div>
    </div>
  );
}

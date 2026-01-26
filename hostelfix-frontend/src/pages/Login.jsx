import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api, { getErrorMessage } from "../api/api";
import { FaUser, FaLock, FaSignInAlt } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [collegeId, setCollegeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if session expired
  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      toast.warning("Session expired. Please login again.");
    }
    setChecking(false);
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!collegeId.trim() || !password.trim()) {
      return toast.error("Please fill all fields");
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        college_id: collegeId,
        password,
      });

      // Save token and user
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Login successful!");

      // Redirect based on role
      const role = res.data.user.role;
      const redirectPath = {
        student: "/student",
        caretaker: "/caretaker",
        admin: "/admin",
      };

      navigate(redirectPath[role] || "/student");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="loginPage">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="loginLogo">🏠</div>
        <h2>HostelFix</h2>
        <p className="subtitle">Hostel Complaint Management</p>

        <form onSubmit={handleLogin}>
          <div className="inputGroup">
            <FaUser className="inputIcon" />
            <input
              type="text"
              placeholder="College ID"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="inputGroup">
            <FaLock className="inputIcon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>Logging in...</>
            ) : (
              <>
                <FaSignInAlt /> Login
              </>
            )}
          </button>
        </form>

        <div className="loginLinks">
          <Link to="/forgot-password">Forgot Password?</Link>
          <span className="divider">•</span>
          <Link to="/register">Create Account</Link>
        </div>
      </div>

      <footer className="loginFooter">
        <p>© 2026 HostelFix. All rights reserved.</p>
      </footer>
    </div>
  );
}

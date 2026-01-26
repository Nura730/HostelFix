import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api, { getErrorMessage } from "../api/api";
import { FaEnvelope, FaKey, FaLock, FaArrowLeft } from "react-icons/fa";
import "./login.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [loading, setLoading] = useState(false);

  const [collegeId, setCollegeId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!collegeId.trim()) {
      return toast.error("Please enter your College ID");
    }

    setLoading(true);
    try {
      await api.post("/auth/send-otp", { college_id: collegeId });
      toast.success("OTP sent to your registered email");
      setStep(2);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 & 3: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      return toast.error("Please enter the 6-digit OTP");
    }

    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords don't match");
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        college_id: collegeId,
        otp,
        newPassword,
      });
      toast.success("Password reset successful! Please login.");
      navigate("/");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginCard">
        <Link to="/" className="backLink">
          <FaArrowLeft /> Back to Login
        </Link>

        <h2>🔐 Reset Password</h2>

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <p className="stepInfo">
              Enter your College ID. We'll send an OTP to your registered email.
            </p>

            <div className="inputGroup">
              <FaEnvelope className="inputIcon" />
              <input
                type="text"
                placeholder="College ID"
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <p className="stepInfo">
              Enter the OTP sent to your email and set a new password.
            </p>

            <div className="inputGroup">
              <FaKey className="inputIcon" />
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                disabled={loading}
              />
            </div>

            <div className="inputGroup">
              <FaLock className="inputIcon" />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="inputGroup">
              <FaLock className="inputIcon" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              className="secondaryBtn"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Change College ID
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

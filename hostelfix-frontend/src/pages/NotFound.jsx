import { Link } from "react-router-dom";
import { FaHome, FaExclamationTriangle } from "react-icons/fa";

export default function NotFound() {
  return (
    <div className="notFoundPage">
      <div className="notFoundContent">
        <FaExclamationTriangle className="notFoundIcon" />
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="homeBtn">
          <FaHome /> Go Home
        </Link>
      </div>
    </div>
  );
}

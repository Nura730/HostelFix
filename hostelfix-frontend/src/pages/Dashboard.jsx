import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await api.get("/dashboard");
      setUser(res.data.user);
    } catch (err) {
      console.error(err);
      navigate("/");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div>
      <h2>Dashboard</h2>

      {user && (
        <pre>{JSON.stringify(user, null, 2)}</pre>
      )}

      <button onClick={logout}>Logout</button>
    </div>
  );
}

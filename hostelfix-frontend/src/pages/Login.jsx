import { useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";
import "./login.css";

export default function Login(){

  const [form,setForm]=useState({
    college_id:"",
    password:""
  });

  const handleLogin = async () =>{
    if(!form.college_id || !form.password){
      toast.error("All fields required");
      return;
    }

    try{
      const res = await api.post("/admin/login",form);

      localStorage.setItem("token",res.data.token);
      localStorage.setItem("user",JSON.stringify(res.data.user));

      toast.success("Login success");

      const role = res.data.user.role;
      if(role==="admin") window.location="/admin";
      else if(role==="caretaker") window.location="/caretaker";
      else window.location="/student";

    }catch{
      toast.error("Invalid credentials");
    }
  };

  return(
    <div className="login-bg">

      <div className="login-card">

        <h1 className="logo">HostelFix</h1>
        <p className="tagline">
          Smart Hostel Management
        </p>

        <input
          placeholder="College ID"
          value={form.college_id}
          onChange={e=>
            setForm({...form,college_id:e.target.value})
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e=>
            setForm({...form,password:e.target.value})
          }
        />

        <button onClick={handleLogin}>
          Login
        </button>

        <small className="note">
          Student • Caretaker • Admin
        </small>

      </div>

    </div>
  );
}

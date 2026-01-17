import { useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaUserLock } from "react-icons/fa";
import "./login.css";

export default function Login(){

  const [success,setSuccess]=useState(false);
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(false);

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
      setLoading(true);

      const res = await api.post("/admin/login",form);

      localStorage.setItem("token",res.data.token);
      localStorage.setItem("user",JSON.stringify(res.data.user));

      toast.success("Login success");
      setSuccess(true);

      const role = res.data.user.role;

      setTimeout(()=>{
        if(role==="admin") window.location="/admin";
        else if(role==="caretaker") window.location="/caretaker";
        else window.location="/student";
      },800);

    }catch{
      setError(true);
      setTimeout(()=>setError(false),500);
      toast.error("Invalid credentials");
    }finally{
      setLoading(false);
    }
  };

  return(
    <div className="loginWrap">

      {/* PARTICLES */}
      <div className="particles">
        {[...Array(30)].map((_,i)=>(
          <span key={i}
           style={{
            left:Math.random()*100+"%",
            animationDelay:i+"s"
           }}
          />
        ))}
      </div>

      {/* LEFT */}
      <div className="loginLeft">
        <h1>HostelFix</h1>
        <p>Smart Hostel Management System</p>
      </div>

      {/* RIGHT */}
      <div className={`loginCard 
        ${error?"shake":""} 
        ${success?"success":""}`}>

        <div className="logoRow">
          <FaUserLock/>
          <h2>Login</h2>
        </div>

        <input
          placeholder="College ID"
          value={form.college_id}
          onChange={e=>
            setForm({...form,college_id:e.target.value})
          }
        />

        <div className="passWrap">
          <input
            type={show?"text":"password"}
            placeholder="Password"
            value={form.password}
            onChange={e=>
              setForm({...form,password:e.target.value})
            }
          />
          {show
            ? <FaEyeSlash onClick={()=>setShow(false)}/>
            : <FaEye onClick={()=>setShow(true)}/>
          }
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
        >
          {loading?"Logging in...":"Login"}
        </button>

        <div className="extras">
          <span className="forgot">
            Forgot password?
          </span>

          <div className="roles">
            <span>Student</span>
            <span>Caretaker</span>
            <span>Admin</span>
          </div>
        </div>

      </div>
    </div>
  );
}

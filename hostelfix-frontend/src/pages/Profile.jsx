import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Profile(){

  const [user,setUser]=useState(null);
  const [image,setImage]=useState(null);
  const [open,setOpen]=useState(false);

  // OTP
  const [collegeId,setCollegeId]=useState("");
  const [otp,setOtp]=useState("");
  const [newPass,setNewPass]=useState("");
  const [step,setStep]=useState(1);

  useEffect(()=>{
    loadProfile();
  },[]);

  const loadProfile=async()=>{
    const res=await api.get("/profile");
    setUser(res.data);
    setCollegeId(res.data.college_id);
  };

  const uploadImage=async()=>{
    if(!image) return alert("Select image");

    const form=new FormData();
    form.append("image",image);

    await api.put("/profile/image",form,{
      headers:{
        "Content-Type":"multipart/form-data"
      }
    });

    alert("Profile updated");
    loadProfile();
  };

  const sendOtp=async()=>{
    await api.post("/auth/send-otp",{
      college_id:collegeId
    });
    alert("OTP sent. Check backend console.");
    setStep(2);
  };

  const resetPassword=async()=>{
    await api.post("/auth/reset-password",{
      college_id:collegeId,
      otp,
      newPassword:newPass
    });
    alert("Password updated");
    setStep(1);
    setOtp("");
    setNewPass("");
  };

  if(!user) return null;

  return(
    <>
      <Navbar toggleSidebar={()=>setOpen(!open)} />
      <Sidebar open={open} />

      <div className="main">

        <h2>Profile</h2>

        {/* INFO */}
        <div className="card">

          {user.image && (
            <img
              src={`http://localhost:5000/uploads/${user.image}`}
              width="120"
              style={{borderRadius:"50%"}}
            />
          )}

          <p><b>College ID:</b> {user.college_id}</p>
          <p><b>Role:</b> {user.role}</p>

          <input
            type="file"
            onChange={e=>setImage(e.target.files[0])}
          />

          <button onClick={uploadImage}>
            Upload Photo
          </button>
        </div>

        {/* PASSWORD */}
        <div className="card">

          <h3>Forgot Password</h3>

          {step===1 && (
            <>
              <input
                value={collegeId}
                readOnly
              />
              <button onClick={sendOtp}>
                Send OTP
              </button>
            </>
          )}

          {step===2 && (
            <>
              <input
                placeholder="Enter OTP"
                value={otp}
                onChange={e=>setOtp(e.target.value)}
              />

              <input
                type="password"
                placeholder="New password"
                value={newPass}
                onChange={e=>setNewPass(e.target.value)}
              />

              <button onClick={resetPassword}>
                Change Password
              </button>
            </>
          )}

        </div>

      </div>
    </>
  );
}

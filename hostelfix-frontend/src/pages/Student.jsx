import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Student() {

  const [message,setMessage]=useState("");
  const [priority,setPriority]=useState("normal");
  const [image,setImage]=useState(null);

  const [myComplaints,setMyComplaints]=useState([]);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [edit,setEdit]=useState(null);
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    loadMyComplaints();
  },[]);

  const loadMyComplaints = async()=>{
    const res = await api.get("/complaint/my");
    setMyComplaints(res.data);
  };

  const submitComplaint = async()=>{

    if(!message.trim()) return;

    const form=new FormData();
    form.append("message",message);
    form.append("priority",priority);
    if(image) form.append("image",image);

    await api.post("/complaint/add",form,{
      headers:{ "Content-Type":"multipart/form-data" }
    });

    setMessage("");
    setPriority("normal");
    setImage(null);
    loadMyComplaints();
  };

  const deleteComplaint = async(id)=>{
    if(!window.confirm("Delete complaint?")) return;
    await api.delete(`/complaint/${id}`);
    loadMyComplaints();
  };

  const updateComplaint = async()=>{
    await api.put(`/complaint/${edit.id}`,{
      message:edit.message
    });
    setEdit(null);
    loadMyComplaints();
  };

  const filtered = myComplaints.filter(c=>{
    const matchText=c.message
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchStatus=
      filter==="all" ? true : c.status===filter;

    return matchText && matchStatus;
  });

  const daysPassed = date=>{
    const d1=new Date(date);
    const d2=new Date();
    return Math.floor(
      (d2-d1)/(1000*60*60*24)
    );
  };

  return(
    <>
      <Navbar toggleSidebar={()=>setOpen(!open)} />
      <Sidebar open={open} />

      <div className="main">

        <h2>🎓 Student Dashboard</h2>

        {/* SUBMIT */}
        <div className="card">

          <h3>➕ New Complaint</h3>

          <textarea
            value={message}
            onChange={e=>setMessage(e.target.value)}
            rows="4"
            placeholder="Describe your issue..."
          />

          <select
            value={priority}
            onChange={e=>setPriority(e.target.value)}
          >
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={e=>setImage(e.target.files[0])}
          />

          <button onClick={submitComplaint}>
            Submit Complaint
          </button>
        </div>

        {/* FILTER */}
        <div style={{display:"flex",gap:10}}>
          <input
            placeholder="Search..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />

          <select
            value={filter}
            onChange={e=>setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <br/>

        {/* LIST */}
        {filtered.map(c=>{

          const days=daysPassed(c.created_at);

          return(
            <div key={c.id} className="card">

              <p>{c.message}</p>

              {c.image && (
                <img
                  src={`http://localhost:5000/uploads/${c.image}`}
                  width="100%"
                  style={{borderRadius:14,marginBottom:10}}
                />
              )}

              <p>
                Priority:
                <span className={`pri ${c.priority}`}>
                  {c.priority}
                </span>
              </p>

              <p>
                Status:
                <span className={`status-${c.status}`}>
                  {c.status}
                </span>
              </p>

              {c.reply && (
                <p style={{color:"#a78bfa"}}>
                  💬 Caretaker: {c.reply}
                </p>
              )}

              <p>
                Days pending: {days}
              </p>

              {c.status==="pending" && days>=7 && (
                <p style={{color:"#facc15"}}>
                  ⚠ No response for 7 days.
                </p>
              )}

              <div style={{marginTop:10}}>

                <button
                  onClick={() => setEdit(c)}
                  style={{background:"#6366f1"}}
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteComplaint(c.id)}
                  style={{
                    background:"#ef4444",
                    marginLeft:10
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {/* EDIT */}
        {edit && (
          <div className="card">
            <h3>Edit Complaint</h3>

            <textarea
              value={edit.message}
              onChange={e=>
                setEdit({
                  ...edit,
                  message:e.target.value
                })
              }
            />

            <button onClick={updateComplaint}>
              Save
            </button>

            <button
              onClick={()=>setEdit(null)}
              style={{
                marginLeft:10,
                background:"#ef4444"
              }}
            >
              Cancel
            </button>
          </div>
        )}

      </div>
    </>
  );
}

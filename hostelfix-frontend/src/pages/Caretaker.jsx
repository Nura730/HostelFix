import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Caretaker(){

  const [list,setList]=useState([]);
  const [page,setPage]=useState(1);
  const [open,setOpen]=useState(false);
  const [comment,setComment]=useState("");

  const perPage=3;

  useEffect(()=>{
    fetchData();
  },[page]);

  const fetchData = async()=>{
    const res = await api.get("/complaint/pending");
    setList(res.data);
  };

  const updateStatus = async(id,status)=>{

    if(!window.confirm(`Are you sure?`)) return;

    await api.put(`/complaint/update/${id}`,{
      status,
      comment
    });

    setComment("");
    fetchData();
  };

  const start=(page-1)*perPage;
  const current=list.slice(start,start+perPage);

  return(
    <>
      <Navbar toggleSidebar={()=>setOpen(!open)} />
      <Sidebar open={open} />

      <div className="main">

        <h2>🛠 Caretaker Dashboard</h2>

        {current.map(c=>(

          <div key={c.id} className="card">

            <h4>👤 Student: {c.student_id}</h4>

            <p style={{margin:"10px 0"}}>
              {c.message}
            </p>

            {/* IMAGE */}
            {c.image && (
              <img
                src={`http://localhost:5000/uploads/${c.image}`}
                width="100%"
                style={{borderRadius:14,marginBottom:10}}
              />
            )}

            {/* COMMENT */}
            <textarea
              placeholder="Write your comment..."
              value={comment}
              onChange={e=>setComment(e.target.value)}
            />

            <div style={{
              display:"flex",
              gap:10,
              marginTop:10
            }}>
              <button
                onClick={()=>updateStatus(c.id,"approved")}
                style={{background:"#22c55e"}}
              >
                Approve
              </button>

              <button
                onClick={()=>updateStatus(c.id,"rejected")}
                style={{background:"#ef4444"}}
              >
                Reject
              </button>
            </div>

          </div>

        ))}

        {/* PAGINATION */}
        <div style={{
          marginTop:20,
          display:"flex",
          alignItems:"center",
          gap:10
        }}>

          <button
            disabled={page===1}
            onClick={()=>setPage(p=>p-1)}
          >
            Prev
          </button>

          <span>
            Page {page}
          </span>

          <button
            disabled={start+perPage>=list.length}
            onClick={()=>setPage(p=>p+1)}
          >
            Next
          </button>

        </div>

      </div>
    </>
  );
}

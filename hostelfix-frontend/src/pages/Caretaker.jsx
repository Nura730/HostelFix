import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";

export default function Caretaker(){

  const [list,setList]=useState([]);
  const [page,setPage]=useState(1);
  const perPage=3;

  useEffect(()=>{
    fetchData();
  },[page]);

  const fetchData = async()=>{
    const res = await api.get("/complaint/pending");
    setList(res.data);
  };

  const updateStatus = async(id,status)=>{

    if(!window.confirm(`Are you sure to ${status}?`))
      return;

    await api.put(`/complaint/update/${id}`,{status});
    fetchData();
  };

  const start=(page-1)*perPage;
  const current=list.slice(start,start+perPage);

  return(
    <>
      <Navbar />

      <div className="page">

        <h2>Caretaker Dashboard</h2>

        {current.length===0 && (
          <div className="card">
            <p>No pending complaints</p>
          </div>
        )}

        {current.map(c=>(
          <div key={c.id} className="card">

            <p><b>Student:</b> {c.student_id}</p>
            <p>{c.message}</p>

            <button
              onClick={()=>updateStatus(c.id,"approved")}
            >
              Approve
            </button>

            <button
              onClick={()=>updateStatus(c.id,"rejected")}
              style={{marginLeft:10}}
            >
              Reject
            </button>
          </div>
        ))}

        {/* PAGINATION */}
        <div style={{marginTop:20}}>
          <button
            disabled={page===1}
            onClick={()=>setPage(p=>p-1)}
          >
            Prev
          </button>

          <span style={{margin:"0 10px"}}>
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

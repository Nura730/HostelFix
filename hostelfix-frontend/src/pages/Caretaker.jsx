import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Caretaker(){

  const [list,setList]=useState([]);
  const [page,setPage]=useState(1);
  const [open,setOpen]=useState(false);
  const [comment,setComment]=useState("");
  const [search,setSearch]=useState("");
  const [auto,setAuto]=useState(false);
  const [preview,setPreview]=useState(null);

  const perPage=3;

  /* LOAD DATA */
  const fetchData = async()=>{
    const res = await api.get("/complaint/pending");

    // urgent first
    const sorted = res.data.sort((a,b)=>{
      if(a.priority==="urgent") return -1;
      if(b.priority==="urgent") return 1;
      return 0;
    });

    setList(sorted);
  };

  useEffect(()=>{
    fetchData();
  },[page]);

  /* AUTO REFRESH */
  useEffect(()=>{
    if(!auto) return;
    const t=setInterval(fetchData,5000);
    return ()=>clearInterval(t);
  },[auto]);

  const updateStatus = async(id,status)=>{

    if(!window.confirm(`Are you sure?`)) return;

    await api.put(`/complaint/update/${id}`,{
      status,
      comment
    });

    setComment("");
    fetchData();
  };

  /* FILTER */
  const filtered=list.filter(c=>
    c.student_id.toLowerCase()
      .includes(search.toLowerCase())
  );

  const start=(page-1)*perPage;
  const current=filtered.slice(start,start+perPage);

  return(
    <>
      <Navbar toggleSidebar={()=>setOpen(!open)} />
      <Sidebar open={open} />

      <div className="main">

        <h2>🛠 Caretaker Dashboard</h2>

{/* TOOLS */}
<div style={{display:"flex",gap:10}}>
<input
 placeholder="Search student..."
 value={search}
 onChange={e=>setSearch(e.target.value)}
/>

<label style={{display:"flex",alignItems:"center",gap:6}}>
<input
 type="checkbox"
 checked={auto}
 onChange={()=>setAuto(!auto)}
/>
Auto refresh
</label>
</div>

<br/>

        {current.map(c=>(

          <div key={c.id} className="card">

<div style={{display:"flex",justifyContent:"space-between"}}>
<h4>👤 {c.student_id}</h4>

<span
 style={{
  padding:"4px 10px",
  borderRadius:10,
  background:
   c.priority==="urgent"?"#ef4444":"#22c55e"
 }}
>
{c.priority}
</span>
</div>

            <p style={{margin:"10px 0"}}>
              {c.message}
            </p>

            {/* IMAGE */}
            {c.image && (
              <img
                src={`http://localhost:5000/uploads/${c.image}`}
                width="100%"
                style={{borderRadius:14,marginBottom:10,cursor:"pointer"}}
                onClick={()=>setPreview(c.image)}
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

<span>Page {page}</span>

<button
 disabled={start+perPage>=filtered.length}
 onClick={()=>setPage(p=>p+1)}
>
Next
</button>

</div>

{/* IMAGE PREVIEW */}
{preview && (
<div
 style={{
  position:"fixed",
  inset:0,
  background:"rgba(0,0,0,.7)",
  display:"flex",
  justifyContent:"center",
  alignItems:"center"
 }}
 onClick={()=>setPreview(null)}
>

<img
 src={`http://localhost:5000/uploads/${preview}`}
 style={{maxWidth:"80%",borderRadius:16}}
/>

</div>
)}

      </div>
    </>
  );
}

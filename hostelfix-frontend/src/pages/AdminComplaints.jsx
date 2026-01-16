import { useEffect, useState } from "react";
import api from "../api/api";

export default function AdminComplaints(){

 const [list,setList]=useState([]);
 const [f,setF]=useState({
  hostel:"",
  status:"",
  dept:"",
  year:"",
  room_no:"",
  date:""
 });

 /* LOAD DATA */
 const load = async()=>{
  try{
    const res = await api.get("/admin/complaints",{
      params:f
    });
    setList(res.data);
  }catch{
    alert("Failed to load complaints");
  }
 };

 useEffect(()=>{
  load();
 },[f]);

 return(
  <div className="card">

   <h3>All Complaints</h3>

{/* FILTERS */}
<div
 style={{
  display:"grid",
  gridTemplateColumns:"repeat(3,1fr)",
  gap:10
 }}
>

<select
 onChange={e=>setF({...f,hostel:e.target.value})}
>
 <option value="">Hostel</option>
 <option>BOYS HOSTEL</option>
 <option>GIRLS HOSTEL</option>
</select>

<select
 onChange={e=>setF({...f,status:e.target.value})}
>
 <option value="">Status</option>
 <option>pending</option>
 <option>approved</option>
 <option>rejected</option>
</select>

<input
 placeholder="Dept"
 onChange={e=>setF({...f,dept:e.target.value})}
/>

<input
 placeholder="Year"
 onChange={e=>setF({...f,year:e.target.value})}
/>

<input
 placeholder="Room"
 onChange={e=>setF({...f,room_no:e.target.value})}
/>

<input
 type="date"
 onChange={e=>setF({...f,date:e.target.value})}
/>

</div>

<br/>

{/* LIST */}
{list.map(c=>(
<div key={c.id} className="card">

<b>{c.student_id}</b>
<p>{c.message}</p>

<p>
 {c.hostel} |
 {c.dept} |
 {c.year} |
 Room {c.room_no}
</p>

<p>Status: {c.status}</p>

</div>
))}

  </div>
 );
}

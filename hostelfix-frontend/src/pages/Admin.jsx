import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from "recharts";


export default function Admin() {

  const [users,setUsers]=useState([]);
  const [stats,setStats]=useState({});
  const [search,setSearch]=useState("");

  useEffect(()=>{
    fetchAll();
  },[]);

  const fetchAll=async()=>{
    try{
      const u = await api.get("/admin/users");
      const s = await api.get("/admin/stats");

      setUsers(u.data);
      setStats(s.data);
    }catch{
      toast.error("Failed to load data");
    }
  };

  const changeRole = async(id,role)=>{
    try{
      await api.put(`/admin/role/${id}`,{role});
      toast.success("Role updated");
      fetchAll();
    }catch{
      toast.error("Update failed");
    }
  };

  const filtered = users.filter(u=>
    u.college_id
     .toLowerCase()
     .includes(search.toLowerCase())
  );

  return(
    <>
      <Navbar />

      <div className="page">

        <h2>Admin Dashboard</h2>

        {/* STATS */}
        <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>

          <div className="card" style={{flex:1}}>
            <h3>User Stats</h3>
            {stats.users?.map(u=>(
              <p key={u.role}>{u.role}: {u.total}</p>
            ))}
          </div>

          <div className="card" style={{flex:1}}>
            <h3>Complaint Stats</h3>
            {stats.complaints?.map(c=>(
              <p key={c.status}>{c.status}: {c.total}</p>
            ))}
          </div>
        </div>

        <h3 style={{marginTop:30}}>Analytics</h3>

<div className="card" style={{height:300}}>

<ResponsiveContainer width="100%" height="100%">

<BarChart data={stats.complaints || []}>
  <XAxis dataKey="status" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="total" />
</BarChart>

</ResponsiveContainer>

</div>


        {/* SEARCH */}
        <input
          placeholder="Search college id..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />

        <br/><br/>

        {/* USERS */}
        <div className="card">
          <h3>All Users</h3>

          {filtered.map(u=>(
            <div key={u.id}
              style={{display:"flex",
                justifyContent:"space-between",
                marginBottom:10}}>

              <span>
                {u.college_id} - {u.role}
              </span>

              <select
                value={u.role}
                onChange={e=>
                  changeRole(u.id,e.target.value)
                }
              >
                <option>student</option>
                <option>caretaker</option>
                <option>admin</option>
              </select>

            </div>
          ))}
        </div>

      </div>
    </>
  );
}
const exportCSV = ()=>{

  let csv="CollegeID,Role\n";

  users.forEach(u=>{
    csv += `${u.college_id},${u.role}\n`;
  });

  const blob = new Blob([csv],
    { type:"text/csv" });

  const url = window.URL.createObjectURL(blob);

  const a=document.createElement("a");
  a.href=url;
  a.download="users.csv";
  a.click();
};
<button onClick={exportCSV}>
 Export Users CSV
</button>

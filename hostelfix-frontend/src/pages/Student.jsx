import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";

export default function Student() {

  const [message, setMessage] = useState("");
  const [myComplaints, setMyComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(()=>{
    loadMyComplaints();
  },[]);

  const loadMyComplaints = async()=>{
    const res = await api.get("/complaint/my");
    setMyComplaints(res.data);
  };

  const submitComplaint = async () => {

    if (!message.trim())
      return alert("Write something first");

    await api.post("/complaint/add", { message });

    setMessage("");
    loadMyComplaints();
  };

  const filtered = myComplaints.filter(c=>{
    const matchText = c.message
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchStatus =
      filter==="all" ? true : c.status===filter;

    return matchText && matchStatus;
  });

  return (
    <>
      <Navbar />

      <div className="page">

        <h2>Student Dashboard</h2>

        <div className="card">
          <textarea
            value={message}
            onChange={(e)=>setMessage(e.target.value)}
            rows="4"
            placeholder="Write complaint..."
          />

          <br/><br/>

          <button onClick={submitComplaint}>
            Submit
          </button>
        </div>

        {/* SEARCH & FILTER */}
        <div style={{display:"flex",gap:10}}>
          <input
            placeholder="Search complaint..."
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

        {filtered.length===0 && (
          <div className="card">
            <p>No matching complaints</p>
          </div>
        )}

        {filtered.map(c=>(
          <div key={c.id} className="card">
            <p>{c.message}</p>
            <p>
              Status:{" "}
              <span className={`status-${c.status}`}>
                {c.status}
              </span>
            </p>
          </div>
        ))}

      </div>
    </>
  );
}

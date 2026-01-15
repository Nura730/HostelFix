import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Student() {

  const [message, setMessage] = useState("");
  const [myComplaints, setMyComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [edit, setEdit] = useState(null); // ✅ moved here

  useEffect(() => {
    loadMyComplaints();
  }, []);

  const loadMyComplaints = async () => {
    const res = await api.get("/complaint/my");
    setMyComplaints(res.data);
  };

  const submitComplaint = async () => {
    if (!message.trim()) return alert("Write something first");

    await api.post("/complaint/add", { message });

    setMessage("");
    loadMyComplaints();
  };

  // DELETE
  const deleteComplaint = async(id)=>{
    if(!window.confirm("Delete complaint?")) return;
    await api.delete(`/complaint/${id}`);
    loadMyComplaints();
  };

  // UPDATE
  const updateComplaint = async()=>{
    await api.put(`/complaint/${edit.id}`,{
      message:edit.message
    });
    setEdit(null);
    loadMyComplaints();
  };

  const filtered = myComplaints.filter((c) => {
    const matchText = c.message
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchStatus =
      filter === "all" ? true : c.status === filter;

    return matchText && matchStatus;
  });

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="main">

        <h2>Student Dashboard</h2>

        {/* ADD COMPLAINT */}
        <div className="card">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
            placeholder="Write complaint..."
          />

          <br /><br />

          <button onClick={submitComplaint}>
            Submit
          </button>
        </div>

        {/* SEARCH & FILTER */}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="Search complaint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <br />

        {filtered.length === 0 && (
          <div className="card">
            <p>No matching complaints</p>
          </div>
        )}

        {filtered.map((c) => (
          <div key={c.id} className="card">

            <p>{c.message}</p>

            <p>
              Status:{" "}
              <span className={`status-${c.status}`}>
                {c.status}
              </span>
            </p>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => setEdit(c)}
                style={{ background: "#3b82f6" }}
              >
                Edit
              </button>

              <button
                onClick={() => deleteComplaint(c.id)}
                style={{
                  background: "#ef4444",
                  marginLeft: 10
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* EDIT POPUP */}
        {edit && (
          <div className="card">
            <h3>Edit Complaint</h3>

            <textarea
              value={edit.message}
              onChange={(e)=>
                setEdit({
                  ...edit,
                  message:e.target.value
                })
              }
            />

            <br /><br />

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

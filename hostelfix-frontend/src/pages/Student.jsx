import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";

import {
  FaClipboardList,
  FaUsers,
  FaUserCircle,
  FaPlus,
  FaTrash,
  FaEdit,
  FaFilePdf,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaSort,
  FaUpload,
} from "react-icons/fa";

export default function Student() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [tab, setTab] = useState("complaints");

  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [image, setImage] = useState(null);

  const [myComplaints, setMyComplaints] = useState([]);
  const [roommates, setRoommates] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new");
  const [edit, setEdit] = useState(null);
  const [profile, setProfile] = useState(null);

  const maxChars = 300;

  /* LOAD */
  const loadMyComplaints = async () => {
    const res = await api.get("/complaint/my");
    setMyComplaints(res.data);
  };

  const loadRoommates = async () => {
    const res = await api.get("/profile/roommates");
    setRoommates(res.data);
  };

  const loadProfile = async () => {
    const res = await api.get("/profile");
    setProfile(res.data);
  };

  useEffect(() => {
    loadMyComplaints();
    loadRoommates();
    loadProfile();
  }, []);

  /* SUBMIT */
  const submitComplaint = async () => {
    if (!message.trim()) return;

    try {
      const form = new FormData();
      form.append("message", message);
      form.append("priority", priority);
      if (image) form.append("image", image);

      await api.post("/complaint/add", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("");
      setPriority("normal");
      setImage(null);
      loadMyComplaints();
    } catch (err) {
      alert(err.response?.data || "Something went wrong");
    }
  };

  /* DELETE */
  const deleteComplaint = async (id) => {
    if (!window.confirm("Delete complaint?")) return;
    await api.delete(`/complaint/${id}`);
    loadMyComplaints();
  };

  /* UPDATE */
  const updateComplaint = async () => {
    await api.put(`/complaint/${edit.id}`, {
      message: edit.message,
    });
    setEdit(null);
    loadMyComplaints();
  };

  /* RESOLVE */
  const markResolved = async (id) => {
    if (!window.confirm("Mark as resolved?")) return;
    await api.put(`/complaint/update/${id}`, {
      status: "approved",
    });
    loadMyComplaints();
  };

  /* PDF */
  const downloadPDF = (c) => {
    const doc = new jsPDF();
    doc.text(`Complaint ID: ${c.id}`, 10, 10);
    doc.text(`Message: ${c.message}`, 10, 20);
    doc.text(`Status: ${c.status}`, 10, 30);
    doc.text(`Priority: ${c.priority}`, 10, 40);
    doc.save(`complaint_${c.id}.pdf`);
  };

  /* FILTER */
  const filtered = myComplaints
    .filter((c) => {
      const matchText = c.message.toLowerCase().includes(search.toLowerCase());

      const matchStatus = filter === "all" ? true : c.status === filter;

      return matchText && matchStatus;
    })
    .sort((a, b) => {
      if (sort === "new")
        return new Date(b.created_at) - new Date(a.created_at);
      return new Date(a.created_at) - new Date(b.created_at);
    });

  return (
    <>
      <Navbar />

      <div className="main">
        <h2>🎓 Student Dashboard</h2>

        {/* TABS */}
        <div className="adminTabs">
          <button
            className={`tabBtn ${tab === "complaints" ? "active" : ""}`}
            onClick={() => setTab("complaints")}
          >
            <FaClipboardList /> Complaints
          </button>

          <button
            className={`tabBtn ${tab === "roommates" ? "active" : ""}`}
            onClick={() => setTab("roommates")}
          >
            <FaUsers /> Roommates
          </button>

          <button
            className={`tabBtn ${tab === "profile" ? "active" : ""}`}
            onClick={() => setTab("profile")}
          >
            <FaUserCircle /> Profile
          </button>
        </div>

        {/* ================= COMPLAINT TAB ================= */}
        {tab === "complaints" && (
          <>
            {/* SUBMIT */}
            <div className="card">
              <h3>
                <FaPlus /> New Complaint
              </h3>

              <textarea
                value={message}
                maxLength={maxChars}
                onChange={(e) => setMessage(e.target.value)}
                rows="4"
                placeholder="Describe your issue..."
              />

              <small>
                {message.length}/{maxChars} characters
              </small>

              <select
                className="customSelect"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>

              <div className="fileBox">
                <label className="fileBtn">
                  <FaUpload /> Upload Proof
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                  />
                </label>

                <small className="fileHint">
                  Upload only if needed (damage, leakage etc.)
                </small>

                {image && <p className="fileName">Selected: {image.name}</p>}
              </div>

              <button onClick={submitComplaint}>Submit Complaint</button>
            </div>

            {/* FILTER */}
            <div className="filterRow">
              <div className="inputIcon">
                <FaSearch />
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="inputIcon">
                <FaFilter />
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

              <div className="inputIcon">
                <FaSort />
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="new">Newest</option>
                  <option value="old">Oldest</option>
                </select>
              </div>
            </div>

            <br />

            {/* LIST */}
            {filtered.length === 0 && (
              <p className="empty">No complaints found</p>
            )}

            {filtered.map((c) => (
              <div key={c.id} className="card complaintCard">
                <div className="complaintTop">
                  <span className={`status-${c.status}`}>
                    {c.status.toUpperCase()}
                  </span>

                  <span className={`pri ${c.priority}`}>{c.priority}</span>
                </div>

                <p className="msg">{c.message}</p>

                {c.image && (
                  <img
                    src={
                      c.image.startsWith("http")
                        ? c.image
                        : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${c.image.startsWith("/") ? "" : "/uploads/"}${c.image}`
                    }
                    className="complaintImg"
                    alt="Complaint"
                  />
                )}

                {c.reply && <p className="reply">Caretaker: {c.reply}</p>}

                <div className="complaintActions">
                  <button onClick={() => setEdit(c)}>
                    <FaEdit /> Edit
                  </button>

                  <button
                    onClick={() => deleteComplaint(c.id)}
                    className="danger"
                  >
                    <FaTrash /> Delete
                  </button>

                  <button onClick={() => markResolved(c.id)}>
                    <FaCheckCircle /> Resolve
                  </button>

                  <button onClick={() => downloadPDF(c)}>
                    <FaFilePdf /> PDF
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ================= ROOMMATES TAB ================= */}
        {tab === "roommates" && (
          <div className="card">
            <h3>
              <FaUsers /> Roommates
            </h3>

            {roommates.length === 0 && <p className="empty">No roommates</p>}

            {roommates.map((r, i) => (
              <p key={i}>
                {r.name} | {r.dept} | Year {r.year}
              </p>
            ))}
          </div>
        )}

        {/* ================= PROFILE TAB ================= */}
        {tab === "profile" && (
          <div className="profileCard">
            <div className="profileTop">
              <div className="avatarBig">{user?.name?.charAt(0)}</div>

              <div>
                <h3>{user?.name}</h3>
                <p>{user?.college_id}</p>
              </div>
            </div>

            <div className="profileGrid">
              <div>
                <span>Department</span>
                <p>{user?.dept || "-"}</p>
              </div>

              <div>
                <span>Year</span>
                <p>{user?.year || "-"}</p>
              </div>

              <div>
                <span>Hostel</span>
                <p>{user?.hostel || "-"}</p>
              </div>

              <div>
                <span>Room</span>
                <p>{user?.room_no || "-"}</p>
              </div>

              <div>
                <span>Role</span>
                <p>{user?.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* EDIT */}
        {edit && (
          <div className="card">
            <h3>Edit Complaint</h3>

            <textarea
              value={edit.message}
              onChange={(e) => setEdit({ ...edit, message: e.target.value })}
            />

            <button onClick={updateComplaint}>Save</button>

            <button
              onClick={() => setEdit(null)}
              style={{ marginLeft: 10, background: "#ef4444" }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  );
}

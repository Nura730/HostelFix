import { useEffect, useState } from "react";
import api from "../api/api";
import { motion } from "framer-motion";
import {
 FaUsers,
 FaDoorOpen,
 FaCheckCircle,
 FaClock
} from "react-icons/fa";

export default function Dashboard(){

 const [stats,setStats]=useState({
  total:0,
  rooms:0,
  approved:0,
  pending:0
 });

 /* LOAD */
 useEffect(()=>{
  api.get("/admin/users").then(r=>{
   setStats(s=>({
    ...s,
    total:r.data.length
   }));
  });

  api.get("/admin/rooms").then(r=>{
   setStats(s=>({
    ...s,
    rooms:r.data.length
   }));
  });

  api.get("/complaint").then(r=>{
   setStats(s=>({
    ...s,
    approved:r.data.filter(c=>c.status==="approved").length,
    pending:r.data.filter(c=>c.status==="pending").length
   }));
  });
 },[]);

 return(
  <div className="dashGrid">

   <Card
    icon={<FaUsers/>}
    title="Total Users"
    value={stats.total}
    glow="#ff00e8"
   />

   <Card
    icon={<FaDoorOpen/>}
    title="Total Rooms"
    value={stats.rooms}
    glow="#00ff17"
   />

   <Card
    icon={<FaCheckCircle/>}
    title="Approved"
    value={stats.approved}
    glow="#22c55e"
   />

   <Card
    icon={<FaClock/>}
    title="Pending"
    value={stats.pending}
    glow="#facc15"
   />

  </div>
 );
}

/* CARD */
function Card({icon,title,value,glow}){

 const [count,setCount]=useState(0);

 useEffect(()=>{
  let i=0;
  const t=setInterval(()=>{
   i++;
   if(i>=value){
    i=value;
    clearInterval(t);
   }
   setCount(i);
  },20);
 },[value]);

 return(
  <motion.div
   className="dashCard"
   whileHover={{scale:1.05}}
   style={{
    boxShadow:`0 0 25px ${glow}`
   }}
  >

   <div className="dashIcon"
    style={{color:glow}}>
    {icon}
   </div>

   <h4>{title}</h4>
   <h1>{count}</h1>

  </motion.div>
 );
}

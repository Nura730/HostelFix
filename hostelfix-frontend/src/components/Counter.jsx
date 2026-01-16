import { useEffect, useState } from "react";

export default function Counter({ to }) {

 const [num,setNum]=useState(0);

 useEffect(()=>{
  let i=0;
  const t=setInterval(()=>{
   i++;
   setNum(i);
   if(i>=to) clearInterval(t);
  },15);
 },[to]);

 return <span>{num}</span>;
}

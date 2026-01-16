import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./index.css";
import "react-toastify/dist/ReactToastify.css";

function Root() {

  /* CUSTOM CURSOR */
  useEffect(() => {

    const cursor = document.createElement("div");
    cursor.className = "cursor";
    document.body.appendChild(cursor);

    const move = (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    };

    window.addEventListener("mousemove", move);

    return () => {
      window.removeEventListener("mousemove", move);
      cursor.remove();
    };

  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(<Root />);

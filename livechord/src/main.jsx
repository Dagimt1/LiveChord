import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./App.css"  // Import our global CSS (converted from app.css)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

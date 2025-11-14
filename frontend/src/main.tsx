import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";                
import App from "./App";
import Home from "./routes/Home";
import Explore from "./routes/Explore";
import Profile from "./routes/Profile";

const router = createBrowserRouter([
  { 
    path: "/", 
    element: <App />, 
    children: [
      { index: true, element: <Home /> },
      { path: "explore", element: <Explore /> },
      { path: "profile", element: <Profile /> }
    ] 
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

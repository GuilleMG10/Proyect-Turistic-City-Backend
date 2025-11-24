import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";                
import App from "./App";
import Home from "./routes/Home";
import Explore from "./routes/Explore";
import Profile from "./routes/Profile";
import ExplorePlaces from "./routes/explore/ExplorePlaces";
import ExploreEvents from "./routes/explore/ExploreEvents";
import ExploreForYou from "./routes/explore/ExploreForYou";
import ExploreCalendar from "./routes/explore/ExploreCalendar";
import ExploreMap from "./routes/explore/ExploreMap";
import ExploreItinerary from "./routes/explore/ExploreItinerary";

const router = createBrowserRouter([
  { 
    path: "/", 
    element: <App />, 
    children: [
      { index: true, element: <Home /> },
      { 
        path: "explore", 
        element: <Explore />,
        children: [
          { index: true, element: <ExplorePlaces /> },
          { path: "events", element: <ExploreEvents /> },
          { path: "for-you", element: <ExploreForYou /> },
          { path: "calendar", element: <ExploreCalendar /> },
          { path: "map", element: <ExploreMap /> },
          { path: "itinerary", element: <ExploreItinerary /> }
        ]
      },
      { path: "profile", element: <Profile /> }
    ] 
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

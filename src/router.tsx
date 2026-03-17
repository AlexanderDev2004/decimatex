
import { createBrowserRouter, createHashRouter } from "react-router-dom";
import Home from "./Home";
import Learn from "./Learn";
import SelectMethod from "./SelectMethod";
import MatrixPage from "./MatrixPage";

const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/learn",
    element: <Learn />,
  },
  {
    path: "/decision",
    element: <SelectMethod />,
  },
  {
    path: "/decision/matrix",
    element: <MatrixPage />,
  },
];

const useHashRouter = typeof window !== "undefined" && window.location.protocol === "file:";

const router = useHashRouter ? createHashRouter(routes) : createBrowserRouter(routes);

export default router;

  

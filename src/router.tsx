
import { createBrowserRouter } from "react-router-dom";
import Home from "./Home";
import Learn from "./Learn";
import SelectMethod from "./SelectMethod";
import MatrixPage from "./MatrixPage";

const router = createBrowserRouter([
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
]);

export default router;

  
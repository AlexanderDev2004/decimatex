import { createBrowserRouter, createHashRouter } from "react-router-dom"
import Layout from "./components/layout/Layout"
import Home from "./Home"
import Learn from "./Learn"
import SelectMethod from "./SelectMethod"
import MatrixPage from "./MatrixPage"
import History from "./routes/History"
import HistoryDetail from "./routes/HistoryDetail"

const routes = [
	{
		element: <Layout />,
		children: [
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
			{
				path: "/history",
				element: <History />,
			},
			{
				path: "/history/:id",
				element: <HistoryDetail />,
			},
		],
	},
]

const useHashRouter =
	typeof window !== "undefined" && window.location.protocol === "file:"

const router = useHashRouter
	? createHashRouter(routes)
	: createBrowserRouter(routes)

export default router

import { Outlet, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BarChart3, Plus, History } from "lucide-react"
import { Link } from "react-router-dom"

function Navbar() {
	const location = useLocation()
	const isActive = (path: string) => location.pathname === path

	return (
		<nav className="border-b bg-background">
			<div className="container mx-auto flex h-14 items-center justify-between px-4">
				<Link to="/" className="flex items-center gap-2 font-bold text-lg">
					<BarChart3 className="h-5 w-5 text-primary" />
					Decimatex
				</Link>
				<div className="flex items-center gap-2">
					<Button
						variant={isActive("/decision") ? "default" : "ghost"}
						size="sm"
						asChild
					>
						<Link to="/decision" className="gap-1.5">
							<Plus className="h-4 w-4" />
							Buat Keputusan
						</Link>
					</Button>
					<Button
						variant={isActive("/history") ? "default" : "ghost"}
						size="sm"
						asChild
					>
						<Link to="/history" className="gap-1.5">
							<History className="h-4 w-4" />
							History
						</Link>
					</Button>
				</div>
			</div>
		</nav>
	)
}

function Layout() {
	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	)
}

export default Layout

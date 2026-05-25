import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	useDecisions,
	useDeleteDecision,
} from "@/features/decision/hooks/use-decisions"
import { ArrowRight, Search, Trash2, Copy, Eye } from "lucide-react"

function History() {
	const navigate = useNavigate()
	const { data: decisions, isLoading } = useDecisions()
	const deleteMutation = useDeleteDecision()
	const [search, setSearch] = useState("")

	const filtered = decisions?.filter((d) =>
		d.name.toLowerCase().includes(search.toLowerCase()),
	)

	return (
		<main className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">History Keputusan</h1>
					<p className="text-muted-foreground">
						Lihat dan kelola keputusan yang telah dibuat
					</p>
				</div>

				<div className="mb-6 flex items-center gap-3">
					<Search className="h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Cari keputusan..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="max-w-sm"
					/>
				</div>

				{isLoading ? (
					<p className="text-muted-foreground">Memuat...</p>
				) : filtered && filtered.length > 0 ? (
					<div className="grid gap-4">
						{filtered.map((decision) => (
							<Card
								key={decision.id}
								className="cursor-pointer transition-shadow hover:shadow-md"
								onClick={() => navigate(`/history/${decision.id}`)}
							>
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div>
											<CardTitle className="text-lg">
												{decision.name}
											</CardTitle>
											<CardDescription>
												{new Date(
													decision.createdAt,
												).toLocaleDateString("id-ID")}
											</CardDescription>
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={(e) => {
													e.stopPropagation()
													navigate(
														`/decision?clone=${decision.id}`,
													)
												}}
												title="Duplikasi"
											>
												<Copy className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={(e) => {
													e.stopPropagation()
													deleteMutation.mutate(
														decision.id,
													)
												}}
												title="Hapus"
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={(e) => {
													e.stopPropagation()
													navigate(
														`/history/${decision.id}`,
													)
												}}
												title="Lihat Detail"
											>
												<Eye className="h-4 w-4" />
											</Button>
											<ArrowRight className="h-4 w-4 text-muted-foreground" />
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground line-clamp-2">
										{decision.description ||
											"Tidak ada deskripsi"}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="text-center py-12">
						<p className="text-muted-foreground">
							{search
								? "Tidak ada keputusan yang cocok dengan pencarian"
								: "Belum ada keputusan yang tersimpan"}
						</p>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => navigate("/decision")}
						>
							Buat Keputusan Pertama
						</Button>
					</div>
				)}
			</div>
		</main>
	)
}

export default History

import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	useDecisions,
} from "@/features/decision/hooks/use-decisions"
import {
	useCriteria,
} from "@/features/decision/hooks/use-criteria"
import {
	useAlternatives,
} from "@/features/decision/hooks/use-alternatives"

import {
	useAnalysisHistory,
} from "@/features/decision/hooks/use-analysis"
import { ArrowLeft, BarChart3 } from "lucide-react"

function HistoryDetail() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { data: decisions } = useDecisions()
	const decision = decisions?.find((d) => d.id === id)
	const { data: criteriaItems } = useCriteria(id)
	const { data: alternativeItems } = useAlternatives(id)
	const { data: analysisHistory } = useAnalysisHistory(id)

	if (!decision) {
		return (
			<main className="min-h-screen bg-background">
				<div className="container mx-auto px-4 py-8">
					<p>Keputusan tidak ditemukan</p>
					<Button onClick={() => navigate("/history")}>
						Kembali ke History
					</Button>
				</div>
			</main>
		)
	}

	const latestAnalysis = analysisHistory?.[0]

	return (
		<main className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<Button
					variant="ghost"
					onClick={() => navigate("/history")}
					className="mb-6 gap-2"
				>
					<ArrowLeft className="h-4 w-4" /> Kembali
				</Button>

				<div className="mb-8">
					<h1 className="text-2xl font-bold">{decision.name}</h1>
					<p className="text-muted-foreground">
						Dibuat pada{" "}
						{new Date(decision.createdAt).toLocaleDateString("id-ID")}
					</p>
				</div>

				<div className="mb-8 grid gap-6 md:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Kriteria</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">
								{criteriaItems?.length ?? 0}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Alternatif</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">
								{alternativeItems?.length ?? 0}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Analisis</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">
								{analysisHistory?.length ?? 0}
							</p>
						</CardContent>
					</Card>
				</div>

				{criteriaItems && criteriaItems.length > 0 && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Kriteria</CardTitle>
							<CardDescription>
								Bobot dan tipe kriteria
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr>
											<th className="border p-2 text-left">
												Nama
											</th>
											<th className="border p-2 text-center">
												Tipe
											</th>
											<th className="border p-2 text-center">
												Bobot
											</th>
										</tr>
									</thead>
									<tbody>
										{criteriaItems.map((c) => (
											<tr key={c.id}>
												<td className="border p-2">
													{c.name}
												</td>
												<td className="border p-2 text-center">
													<span
														className={`rounded px-2 py-0.5 text-xs ${
															c.type === "benefit"
																? "bg-green-100 text-green-700"
																: "bg-red-100 text-red-700"
														}`}
													>
														{c.type}
													</span>
												</td>
												<td className="border p-2 text-center">
													{(
														Number.parseFloat(
															c.weight,
														) * 100
													).toFixed(2)}
													%
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				)}

				{alternativeItems && alternativeItems.length > 0 && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Alternatif</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2">
								{alternativeItems.map((a) => (
									<li
										key={a.id}
										className="rounded border p-3"
									>
										{a.name}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				)}

				{latestAnalysis && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5" />
								Hasil Analisis Terakhir
							</CardTitle>
							<CardDescription>
								{latestAnalysis.method?.name ||
									latestAnalysis.methodCode}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{latestAnalysis.results &&
							latestAnalysis.results.length > 0 && (
								<div className="space-y-3">
									{latestAnalysis.results
										.sort((a, b) => a.rank - b.rank)
										.map((r) => (
											<div
												key={r.alternativeId}
												className={`flex items-center justify-between rounded-lg border p-3 ${
													r.rank === 1
														? "border-yellow-400 bg-yellow-50"
														: ""
												}`}
											>
												<div className="flex items-center gap-3">
													<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
														{r.rank}
													</span>
													<span>
														{r.alternative
															?.name ||
															r.alternativeId}
													</span>
												</div>
												<span className="font-medium">
													{Number.parseFloat(
														r.score,
													).toFixed(6)}
												</span>
											</div>
										))}
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</main>
	)
}

export default HistoryDetail

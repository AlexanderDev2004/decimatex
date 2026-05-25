import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	ArrowLeft,
	Plus,
	Trash2,
	ListChecks,
	Calculator,
	Save,
	Play,
	FileText,
} from "lucide-react"
import {
	runMethod,
	createMethodStepDetails,
	buildMatrix2d,
	normalizeWeights,
	buildEqualWeights,
	formatNumber,
	METHOD_NAMES,
} from "@/features/decision/lib/methods"
import type { Criteria, Alternative, MatrixValue, RankingResult } from "@/features/decision/lib/methods"

type WeightInputMode = "percentage" | "decimal"

function MatrixPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	const method = searchParams.get("method") || "topsis"
	const decisionName = decodeURIComponent(searchParams.get("name") || "")

	const [criteria, setCriteria] = useState<Criteria[]>([])
	const [alternatives, setAlternatives] = useState<Alternative[]>([])
	const [matrix, setMatrix] = useState<MatrixValue[]>([])
	const [currentCriteria, setCurrentCriteria] = useState("")
	const [currentCriteriaType, setCurrentCriteriaType] = useState<"benefit" | "cost">("benefit")
	const [isWeightEnabled, setIsWeightEnabled] = useState(true)
	const [weightMode, setWeightMode] = useState<WeightInputMode>("percentage")
	const [currentAlternative, setCurrentAlternative] = useState("")
	const [results, setResults] = useState<RankingResult[] | null>(null)
	const [showResults, setShowResults] = useState(false)
	const [showSteps, setShowSteps] = useState(false)
	const [showFormulaPopup, setShowFormulaPopup] = useState(false)

	const addCriteria = () => {
		if (currentCriteria.trim()) {
			const nextCount = criteria.length + 1
			const normalizedCurrent = normalizeWeights(
				criteria.map((criterion) => criterion.weight),
				criteria.length,
			)
			const newWeight = 1 / nextCount
			const adjustedCriteria = criteria.map((criterion, index) => ({
				...criterion,
				weight: normalizedCurrent[index] * (1 - newWeight),
			}))

			const newCriteria: Criteria = {
				id: crypto.randomUUID(),
				name: currentCriteria,
				type: currentCriteriaType,
				weight: newWeight,
			}

			setCriteria([...adjustedCriteria, newCriteria])
			setCurrentCriteria("")
		}
	}

	const addAlternative = () => {
		if (currentAlternative.trim()) {
			const newAlt: Alternative = {
				id: crypto.randomUUID(),
				name: currentAlternative,
			}
			setAlternatives([...alternatives, newAlt])
			setCurrentAlternative("")
		}
	}

	const removeCriteria = (id: string) => {
		const filteredCriteria = criteria.filter((criterion) => criterion.id !== id)
		if (filteredCriteria.length === 0) {
			setCriteria([])
		} else {
			const normalized = normalizeWeights(
				filteredCriteria.map((criterion) => criterion.weight),
				filteredCriteria.length,
			)
			setCriteria(
				filteredCriteria.map((criterion, index) => ({
					...criterion,
					weight: normalized[index],
				})),
			)
		}
		setMatrix(matrix.filter((m) => m.criteriaId !== id))
	}

	const removeAlternative = (id: string) => {
		setAlternatives(alternatives.filter((a) => a.id !== id))
		setMatrix(matrix.filter((m) => m.alternativeId !== id))
	}

	const updateMatrixValue = (altId: string, critId: string, value: number) => {
		setMatrix((prev) => {
			const existing = prev.find(
				(m) => m.alternativeId === altId && m.criteriaId === critId,
			)
			if (existing) {
				return prev.map((m) =>
					m.alternativeId === altId && m.criteriaId === critId
						? { ...m, value }
						: m,
				)
			}
			return [...prev, { alternativeId: altId, criteriaId: critId, value }]
		})
	}

	const updateCriteriaWeight = (criteriaId: string, inputValue: string) => {
		const parsed = Number.parseFloat(inputValue.replace(",", "."))
		const safeInput = Number.isFinite(parsed) ? Math.max(0, parsed) : 0
		const decimalWeight = weightMode === "percentage" ? safeInput / 100 : safeInput

		setCriteria((prev) =>
			prev.map((criterion) =>
				criterion.id === criteriaId
					? { ...criterion, weight: decimalWeight }
					: criterion,
			),
		)
	}

	const getDisplayWeight = (weight: number): number =>
		Number.parseFloat(
			(weightMode === "percentage" ? weight * 100 : weight).toFixed(6),
		)

	const rawWeights = criteria.map((criterion) => Math.max(0, criterion.weight))
	const normalizedInputWeights = normalizeWeights(rawWeights, criteria.length)
	const effectiveWeights = isWeightEnabled
		? normalizedInputWeights
		: buildEqualWeights(criteria.length)
	const rawWeightTotal = rawWeights.reduce((acc, weight) => acc + weight, 0)
	const displayedWeightTotal =
		weightMode === "percentage" ? rawWeightTotal * 100 : rawWeightTotal
	const hasValidWeightInput = !isWeightEnabled || rawWeightTotal > 0
	const canCalculate =
		criteria.length >= 2 && alternatives.length >= 2 && hasValidWeightInput

	const handleRunCalculation = () => {
		if (!canCalculate) {
			return
		}

		const calculationWeights = effectiveWeights
		const results = runMethod(
			method,
			criteria,
			alternatives,
			matrix,
			calculationWeights,
		)

		setResults(results)
		setShowResults(true)
	}

	const methodName = METHOD_NAMES[method] || method

	const stepMatrix =
		showSteps && results ? buildMatrix2d(criteria, alternatives, matrix) : []

	const methodStepDetails =
		showSteps && results
			? createMethodStepDetails(method, criteria, alternatives, matrix, effectiveWeights)
			: null

	return (
		<main className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<Button
					variant="ghost"
					onClick={() => navigate("/decision")}
					className="mb-6 gap-2"
				>
					<ArrowLeft className="h-4 w-4" /> Kembali ke Pemilihan Metode
				</Button>

				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">{decisionName}</h1>
						<p className="text-muted-foreground">
							Metode: {methodName}
						</p>
					</div>
				</div>

				{!showResults ? (
					<>
						<div className="mb-8 grid gap-6 md:grid-cols-2">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<span className="flex items-center gap-2">
											<ListChecks className="h-5 w-5" />
											Kriteria
										</span>
										<span className="text-sm font-normal text-muted-foreground">
											{criteria.length} kriteria
										</span>
									</CardTitle>
									<CardDescription>
										Faktor evaluasi untuk alternatif
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex gap-2">
										<div className="flex flex-1 gap-2">
											<Input
												placeholder="Nama kriteria..."
												value={currentCriteria}
												onChange={(e) =>
													setCurrentCriteria(e.target.value)
												}
												onKeyDown={(e) =>
													e.key === "Enter" && addCriteria()
												}
												className="flex-1"
											/>
											<select
												value={currentCriteriaType}
												onChange={(e) =>
													setCurrentCriteriaType(
														e.target.value as "benefit" | "cost",
													)
												}
												className="rounded-md border bg-background px-3 py-2"
											>
												<option value="benefit">Benefit</option>
												<option value="cost">Cost</option>
											</select>
										</div>
										<Button onClick={addCriteria} size="icon">
											<Plus className="h-4 w-4" />
										</Button>
									</div>

									<div className="space-y-3 rounded-md border p-3">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">
												Gunakan bobot kriteria
											</span>
											<div className="flex items-center gap-3">
												<span className="text-xs text-muted-foreground">
													{isWeightEnabled ? "Aktif" : "Nonaktif"}
												</span>
												<Switch
													checked={isWeightEnabled}
													onCheckedChange={setIsWeightEnabled}
													aria-label="Gunakan bobot kriteria"
												/>
											</div>
										</div>

										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">
												Mode input bobot
											</span>
											<select
												value={weightMode}
												onChange={(e) =>
													setWeightMode(
														e.target.value as WeightInputMode,
													)
												}
												disabled={!isWeightEnabled}
												className="rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
											>
												<option value="percentage">
													Persentase (%)
												</option>
												<option value="decimal">
													Desimal (0-1)
												</option>
											</select>
										</div>
									</div>

									{isWeightEnabled ? (
										<p className="text-xs text-muted-foreground">
											Total bobot input:{" "}
											{formatNumber(displayedWeightTotal, 4)}
											{weightMode === "percentage" ? "%" : ""}
										</p>
									) : (
										<p className="text-xs text-muted-foreground">
											{criteria.length > 0
												? `Bobot dinonaktifkan. Sistem memakai bobot sama rata (${formatNumber(1 / criteria.length, 4)} per kriteria).`
												: "Bobot dinonaktifkan. Tambahkan kriteria untuk membentuk bobot sama rata."}
										</p>
									)}

									<div className="space-y-2">
										{criteria.map((c, index) => (
											<div
												key={c.id}
												className="flex items-center justify-between rounded-lg border p-3"
											>
												<div className="space-y-1">
													<div>
														<span className="font-medium">
															{c.name}
														</span>
														<span
															className={`ml-2 rounded px-2 py-0.5 text-xs ${
																c.type === "benefit"
																	? "bg-green-100 text-green-700"
																	: "bg-red-100 text-red-700"
															}`}
														>
																{c.type}
															</span>
													</div>
													<p className="text-xs text-muted-foreground">
														Bobot dipakai (hitung):{" "}
														{formatNumber(
																effectiveWeights[index] ?? 0,
																4,
															)}
													</p>
												</div>

												<div className="flex items-center gap-2">
													<Input
														type="number"
														step="any"
														min="0"
														value={getDisplayWeight(c.weight)}
														onChange={(e) =>
															updateCriteriaWeight(
																c.id,
																e.target.value,
															)
														}
														disabled={!isWeightEnabled}
														className="h-8 w-28 text-right"
													/>
													<span className="w-5 text-center text-xs text-muted-foreground">
														{weightMode === "percentage" ? "%" : ""}
													</span>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => removeCriteria(c.id)}
													>
														<Trash2 className="h-4 w-4 text-red-500" />
													</Button>
												</div>
											</div>
										))}
										{criteria.length === 0 && (
											<p className="py-4 text-center text-sm text-muted-foreground">
												Tambahkan minimal 2 kriteria
											</p>
										)}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<span className="flex items-center gap-2">
											<ListChecks className="h-5 w-5" />
											Alternatif
										</span>
										<span className="text-sm font-normal text-muted-foreground">
											{alternatives.length} alternatif
										</span>
									</CardTitle>
									<CardDescription>
										Opsi yang akan dievaluasi
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex gap-2">
										<Input
											placeholder="Nama alternatif..."
											value={currentAlternative}
											onChange={(e) =>
												setCurrentAlternative(e.target.value)
											}
											onKeyDown={(e) =>
												e.key === "Enter" && addAlternative()
											}
											className="flex-1"
										/>
										<Button onClick={addAlternative} size="icon">
											<Plus className="h-4 w-4" />
										</Button>
									</div>
									<div className="space-y-2">
										{alternatives.map((a) => (
											<div
												key={a.id}
												className="flex items-center justify-between rounded-lg border p-3"
											>
												<span className="font-medium">{a.name}</span>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => removeAlternative(a.id)}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											</div>
										))}
										{alternatives.length === 0 && (
											<p className="py-4 text-center text-sm text-muted-foreground">
												Tambahkan minimal 2 alternatif
											</p>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						{criteria.length >= 2 && alternatives.length >= 2 && (
							<Card className="mb-8">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Calculator className="h-5 w-5" />
										Matriks Keputusan
									</CardTitle>
									<CardDescription>
										Masukkan nilai untuk setiap alternatif pada setiap
										kriteria
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="overflow-x-auto">
										<table className="w-full">
											<thead>
												<tr>
													<th className="p-2 text-left">
														Alternatif
													</th>
													{criteria.map((c) => (
														<th
															key={c.id}
															className="p-2 text-center"
														>
															{c.name}
															<span
																className={`ml-1 text-xs ${
																	c.type === "benefit"
																		? "text-green-600"
																		: "text-red-600"
																}`}
															>
																({c.type})
															</span>
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{alternatives.map((alt) => (
													<tr key={alt.id}>
														<td className="p-2 font-medium">
															{alt.name}
														</td>
														{criteria.map((crit) => {
															const val = matrix.find(
																(m) =>
																	m.alternativeId === alt.id &&
																	m.criteriaId === crit.id,
															)?.value
															return (
																<td
																	key={crit.id}
																	className="p-2"
																>
																	<Input
																		type="number"
																		step="any"
																		placeholder="0"
																		value={val ?? ""}
																		onChange={(e) =>
																			updateMatrixValue(
																				alt.id,
																				crit.id,
																				parseFloat(
																					e.target.value,
																				) || 0,
																			)
																		}
																		className="w-24 text-center"
																	/>
																</td>
														)
														})}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</CardContent>
							</Card>
						)}

						<div className="flex justify-center">
							<Button
								size="lg"
								className="gap-2"
								disabled={!canCalculate}
								onClick={handleRunCalculation}
							>
								<Play className="h-4 w-4" />
								Hitung Ranking
							</Button>
						</div>

						{isWeightEnabled &&
							criteria.length >= 2 &&
							alternatives.length >= 2 &&
							rawWeightTotal <= 0 && (
								<p className="mt-3 text-center text-sm text-red-600">
									Total bobot harus lebih dari 0.
								</p>
							)}
					</>
				) : (
					<Card>
						<CardHeader>
							<CardTitle>
								Hasil Ranking - {methodName}
							</CardTitle>
							<CardDescription>
								Ranking alternatif berdasarkan perhitungan {methodName}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{results?.map((result) => (
									<div
										key={result.alternativeId}
										className={`flex items-center justify-between rounded-lg border p-4 ${
											result.rank === 1
												? "border-yellow-400 bg-yellow-50"
												: ""
										}`}
									>
										<div className="flex items-center gap-4">
											<div
												className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
													result.rank === 1
														? "bg-yellow-400 text-white"
														: result.rank === 2
															? "bg-gray-300 text-gray-700"
															: result.rank === 3
																? "bg-amber-600 text-white"
																: "bg-muted"
												}`}
											>
												{result.rank}
											</div>
											<div>
												<p className="font-medium">
													{result.alternativeName}
												</p>
												<p className="text-sm text-muted-foreground">
													Skor: {result.score.toFixed(6)}
												</p>
											</div>
										</div>
										{result.rank === 1 && (
											<span className="font-medium text-yellow-600">
												Pemenang
											</span>
										)}
									</div>
								))}
							</div>
							<div className="mt-6 flex flex-wrap gap-4">
								<Button
									variant="outline"
									onClick={() => {
										setShowResults(false)
										setShowFormulaPopup(false)
									}}
								>
									Ubah Input
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										const nextShowSteps = !showSteps
										setShowSteps(nextShowSteps)
										if (!nextShowSteps) {
											setShowFormulaPopup(false)
										}
									}}
									className="gap-2"
								>
									<FileText className="h-4 w-4" />
									{showSteps
										? "Sembunyikan Langkah"
										: "Lihat Langkah Perhitungan"}
								</Button>
								<Button className="gap-2">
									<Save className="h-4 w-4" />
									Simpan Hasil
								</Button>
							</div>

							{showSteps && results && methodStepDetails && (
								<div className="mt-6 space-y-4">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center justify-between gap-3">
												<span>
													Langkah-langkah Perhitungan{" "}
													{methodName}
												</span>
												<Button
													variant="outline"
													size="icon"
													className="h-7 w-7 text-xs font-bold"
													title="Lihat rumus dan hasil"
													aria-label="Lihat rumus dan hasil"
													onClick={() =>
														setShowFormulaPopup(true)
													}
												>
													!
												</Button>
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-6">
											<div>
												<h4 className="mb-2 font-semibold">
													Langkah 1 : Menentukan alternatif
												</h4>
												<ul className="list-disc space-y-1 pl-5 text-sm">
													{alternatives.map((alt) => (
														<li key={alt.id}>{alt.name}</li>
													))}
												</ul>
											</div>

											<div>
												<h4 className="mb-2 font-semibold">
													Langkah 2 : Menentukan kriteria
												</h4>
												<ul className="list-disc space-y-1 pl-5 text-sm">
													{criteria.map((crit) => (
														<li key={crit.id}>
															{crit.name} ({crit.type})
														</li>
													))}
												</ul>
											</div>

											<div>
												<h4 className="mb-2 font-semibold">
													Langkah 3 : Menentukan nilai setiap
													kriteria untuk setiap alternatif
												</h4>
												<div className="overflow-x-auto">
													<table className="w-full border-collapse text-sm">
														<thead>
															<tr>
																<th className="border p-2 text-left">
																	Alternatif
																</th>
																{criteria.map((c) => (
																	<th
																		key={c.id}
																		className="border p-2 text-center"
																	>
																		{c.name}
																	</th>
																))}
															</tr>
														</thead>
														<tbody>
															{alternatives.map(
																(alt, i) => (
																	<tr key={alt.id}>
																		<td className="border p-2 font-medium">
																			{alt.name}
																		</td>
																		{criteria.map(
																			(crit, j) => (
																				<td
																					key={crit.id}
																					className="border p-2 text-center"
																				>
																					{formatNumber(
																						stepMatrix[i][j] ?? 0,
																						4,
																					)}
																				</td>
																			),
																		)}
																	</tr>
																),
															)}
														</tbody>
													</table>
												</div>
											</div>

											<div className="space-y-3">
												<h4 className="mb-2 font-semibold">
													Langkah 4 :{" "}
													{methodStepDetails.step4Title}
												</h4>
												<p className="text-sm text-muted-foreground">
													Rumus tersedia di tombol "!".
												</p>
												{methodStepDetails.step4Notes?.map(
													(note, index) => (
														<p
															key={`${note}-${index}`}
															className="text-sm text-muted-foreground"
														>
															{note}
														</p>
													),
												)}
												{methodStepDetails.step4Tables.map(
													(table, tableIndex) => (
														<div
															key={`${table.title}-${tableIndex}`}
															className="space-y-2"
														>
															<p className="text-sm font-medium">
																{table.title}
															</p>
															<div className="overflow-x-auto">
																<table className="w-full border-collapse text-sm">
																	<thead>
																		<tr>
																			<th className="border p-2 text-left">
																				{table.rowHeader ??
																					"Alternatif"}
																			</th>
																			{table.headers.map(
																				(header) => (
																					<th
																						key={`${table.title}-${header}`}
																						className="border p-2 text-center"
																					>
																						{header}
																					</th>
																				),
																		)}
																	</tr>
																	</thead>
																	<tbody>
																		{table.rows.map(
																				(
																					row,
																					rowIndex,
																				) => (
																					<tr
																						key={`${table.title}-${row.label}-${rowIndex}`}
																					>
																						<td className="border p-2 font-medium">
																							{row.label}
																						</td>
																						{row.values.map(
																							(
																							value,
																							valueIndex,
																						) => (
																							<td
																								key={`${table.title}-${row.label}-${valueIndex}`}
																								className="border p-2 text-center"
																							>
																								{formatNumber(
																									value,
																								table.digits ??
																										4,
																								)}
																							</td>
																						),
																					)}
																				</tr>
																			),
																		)}
																	</tbody>
															</table>
														</div>
														</div>
													),
												)}
											</div>

											<div>
												<h4 className="mb-2 font-semibold">
													Langkah 5 : Menentukan bobot setiap
													kriteria
												</h4>
												{isWeightEnabled ? (
													<p className="mb-2 text-sm text-muted-foreground">
														Bobot input akan dinormalisasi agar
														total bobot = 1 sebelum perhitungan.
													</p>
												) : (
													<p className="mb-2 text-sm text-muted-foreground">
														Bobot dinonaktifkan. Sistem memakai
														bobot sama rata (w_j = 1/n).
													</p>
												)}
												<div className="overflow-x-auto">
													<table className="w-full border-collapse text-sm">
														<thead>
															<tr>
																<th className="border p-2 text-left">
																	Kriteria
																</th>
																<th className="border p-2 text-center">
																	Bobot input
																</th>
																<th className="border p-2 text-center">
																	Bobot dipakai (w_j)
																</th>
															</tr>
														</thead>
														<tbody>
															{criteria.map(
																(crit, index) => (
																	<tr key={crit.id}>
																		<td className="border p-2">
																			{crit.name}
																		</td>
																		<td className="border p-2 text-center">
																			{isWeightEnabled
																				? `${formatNumber(
																					getDisplayWeight(
																						crit.weight,
																					),
																					4,
																					)}${weightMode === "percentage" ? "%" : ""}`
																				: "-"}
																		</td>
																		<td className="border p-2 text-center">
																				{formatNumber(
																						effectiveWeights[index] ?? 0,
																						4,
																					)}
																		</td>
																	</tr>
																),
															)}
														</tbody>
													</table>
												</div>
											</div>

											<div className="space-y-3">
												<h4 className="mb-2 font-semibold">
													Langkah 6 :{" "}
													{methodStepDetails.step6Title}
												</h4>
												<p className="text-sm text-muted-foreground">
													Rumus tersedia di tombol "!".
												</p>
												{methodStepDetails.step6Notes?.map(
													(note, index) => (
														<p
															key={`${note}-${index}`}
															className="text-sm text-muted-foreground"
														>
															{note}
														</p>
													),
												)}
												<div className="space-y-2">
													<p className="text-sm font-medium">
														{methodStepDetails.step6Table.title}
													</p>
													<div className="overflow-x-auto">
														<table className="w-full border-collapse text-sm">
															<thead>
																<tr>
																	<th className="border p-2 text-left">
																		{methodStepDetails
																			.step6Table
																			.rowHeader ??
																				"Alternatif"}
																	</th>
																	{methodStepDetails.step6Table.headers.map(
																		(header) => (
																			<th
																				key={`step6-${header}`}
																				className="border p-2 text-center"
																			>
																					{header}
																				</th>
																		),
																	)}
															</tr>
															</thead>
															<tbody>
																{methodStepDetails.step6Table.rows.map(
																		(
																			row,
																			rowIndex,
																		) => (
																			<tr
																				key={`step6-${row.label}-${rowIndex}`}
																			>
																				<td className="border p-2 font-medium">
																					{row.label}
																				</td>
																				{row.values.map(
																					(
																						value,
																						valueIndex,
																					) => (
																						<td
																							key={`step6-${row.label}-${valueIndex}`}
																							className="border p-2 text-center"
																						>
																							{formatNumber(
																								value,
																								methodStepDetails
																									.step6Table
																									.digits ??
																										4,
																								)}
																						</td>
																					),
																				)}
																			</tr>
																		),
																	)}
															</tbody>
														</table>
													</div>
												</div>
											</div>

											<div>
												<h4 className="mb-2 font-semibold">
													Langkah 7 : Hasil
												</h4>
												<table className="w-full border-collapse text-sm">
													<thead>
														<tr>
															<th className="border p-2 text-center">
																Rank
															</th>
															<th className="border p-2 text-left">
																Alternatif
															</th>
															<th className="border p-2 text-center">
																Skor
															</th>
														</tr>
													</thead>
													<tbody>
														{results.map(
															(r) => (
																<tr key={r.alternativeId}>
																	<td className="border p-2 text-center font-bold">
																		{r.rank}
																	</td>
																	<td className="border p-2">
																		{r.alternativeName}
																	</td>
																	<td className="border p-2 text-center">
																		{formatNumber(
																			r.score,
																			6,
																			)}
																	</td>
																</tr>
															),
															)}
													</tbody>
												</table>
											</div>
										</CardContent>
									</Card>

									{showFormulaPopup && (
										<div
											className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
											onClick={() => setShowFormulaPopup(false)}
										>
											<div
												className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border bg-background p-4 shadow-xl"
												onClick={(e) => e.stopPropagation()}
											>
												<div className="mb-4 flex items-center justify-between gap-3">
													<h3 className="text-lg font-semibold">
														Rumus & Hasil Perhitungan{" "}
														{methodName}
													</h3>
													<Button
														variant="outline"
														onClick={() =>
															setShowFormulaPopup(false)
														}
													>
														Tutup
													</Button>
												</div>

												<div className="space-y-6">
													<div className="space-y-2">
														<h4 className="font-semibold">
															Langkah 1 : Menentukan
															alternatif
														</h4>
														<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
															<code>
																A ={" "}
																{"{A_1, A_2, ..., A_m}"}
															</code>
														</pre>
														<p className="text-sm text-muted-foreground">
																m = {alternatives.length}{" "}
																alternatif:{" "}
																{alternatives
																	.map(
																		(alt) =>
																			alt.name,
																	)
																	.join(", ")}
															</p>
													</div>

													<div className="space-y-2">
														<h4 className="font-semibold">
															Langkah 2 : Menentukan
															kriteria
															</h4>
														<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
															<code>
																C ={" "}
																{"{C_1, C_2, ..., C_n}"}
															</code>
														</pre>
														<p className="text-sm text-muted-foreground">
																n = {criteria.length}{" "}
																kriteria:{" "}
																{criteria
																	.map(
																		(crit) =>
																			`${crit.name} (${crit.type})`,
																	)
																	.join(", ")}
															</p>
													</div>

													<div className="space-y-2">
														<h4 className="font-semibold">
															Langkah 3 : Menentukan nilai
															setiap kriteria untuk
															setiap alternatif
														</h4>
														<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
															<code>
																X = [x_ij], i = 1..m, j
																= 1..n
															</code>
														</pre>
														<div className="overflow-x-auto">
															<table className="w-full border-collapse text-sm">
																<thead>
																	<tr>
																		<th className="border p-2 text-left">
																			Alternatif
																		</th>
																		{criteria.map(
																			(c) => (
																				<th
																					key={`popup-step3-${c.id}`}
																					className="border p-2 text-center"
																				>
																					{c.name}
																				</th>
																			),
																		)}
																	</tr>
																</thead>
																<tbody>
																	{alternatives.map(
																		(alt, i) => (
																			<tr
																				key={`popup-step3-${alt.id}`}
																				>
																				<td className="border p-2 font-medium">
																					{alt.name}
																				</td>
																				{criteria.map(
																				(
																					crit,
																					j,
																				) => (
																					<td
																						key={`popup-step3-${alt.id}-${crit.id}`}
																						className="border p-2 text-center"
																					>
																							{formatNumber(
																									stepMatrix[i][j] ?? 0,
																									4,
																								)}
																					</td>
																				),
																				)}
																			</tr>
																		),
																	)}
																</tbody>
															</table>
														</div>
													</div>

													<div className="space-y-3">
														<h4 className="font-semibold">
															Langkah 4 :{" "}
															{
																methodStepDetails.step4Title
															}
															</h4>
														<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
															<code>
																{methodStepDetails.step4Formula.join(
																	"\n",
																)}
															</code>
														</pre>
														{methodStepDetails.step4Notes?.map(
															(
																note,
																index,
															) => (
																<p
																	key={`popup-step4-note-${index}`}
																	className="text-sm text-muted-foreground"
																>
																	{note}
																</p>
															),
															)}
														{methodStepDetails.step4Tables.map(
																(
																	table,
																	tableIndex,
																) => (
																	<div
																		key={`popup-step4-table-${tableIndex}`}
																		className="space-y-2"
																	>
																		<p className="text-sm font-medium">
																			{
																				table.title
																			}
																		</p>
																		<div className="overflow-x-auto">
																			<table className="w-full border-collapse text-sm">
																				<thead>
																					<tr>
																						<th className="border p-2 text-left">
																							{table.rowHeader ??
																								"Alternatif"}
																						</th>
																						{table.headers.map(
																							(
																								header,
																							) => (
																								<th
																									key={`popup-step4-${tableIndex}-${header}`}
																									className="border p-2 text-center"
																								>
																									{header}
																								</th>
																							),
																						)}
																					</tr>
																					</thead>
																					<tbody>
																						{table.rows.map(
																							(
																								row,
																								rowIndex,
																							) => (
																								<tr
																									key={`popup-step4-${tableIndex}-${rowIndex}`}
																								>
																									<td className="border p-2 font-medium">
																										{row.label}
																									</td>
																									{row.values.map(
																										(
																										value,
																										valueIndex,
																									) => (
																										<td
																											key={`popup-step4-${tableIndex}-${rowIndex}-${valueIndex}`}
																											className="border p-2 text-center"
																										>
																											{formatNumber(
																												value,
																												table.digits ??
																													4,
																											)}
																										</td>
																									),
																									)}
																								</tr>
																								),
																							)}
																						</tbody>
																				</table>
																			</div>
																		</div>
																	),
																)}
														</div>

													<div className="space-y-2">
														<h4 className="font-semibold">
															Langkah 5 : Menentukan bobot
															setiap kriteria
															</h4>
														<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
															<code>
																{isWeightEnabled
																	? "w_j' = w_j / sum_j w_j"
																	: "w_j = 1 / n"}
															</code>
														</pre>
														{isWeightEnabled ? (
																<p className="text-sm text-muted-foreground">
																	Total bobot input:{" "}
																	{formatNumber(
																		displayedWeightTotal,
																		4,
																	)}
																	{weightMode === "percentage"
																		? "%"
																		: ""}
																</p>
															) : (
																<p className="text-sm text-muted-foreground">
																	Bobot dinonaktifkan. Sistem memakai
																	bobot sama rata (w_j = 1/n).
																</p>
															)}
														<div className="overflow-x-auto">
															<table className="w-full border-collapse text-sm">
																<thead>
																	<tr>
																		<th className="border p-2 text-left">
																			Kriteria
																		</th>
																		<th className="border p-2 text-center">
																			Bobot input
																		</th>
																		<th className="border p-2 text-center">
																			Bobot dipakai
																			(w_j)
																		</th>
																	</tr>
																</thead>
																<tbody>
																	{criteria.map(
																		(crit, index) => (
																			<tr
																				key={`popup-step5-${crit.id}`}
																				>
																					<td className="border p-2">
																						{crit.name}
																					</td>
																					<td className="border p-2 text-center">
																						{isWeightEnabled
																							? `${formatNumber(
																								getDisplayWeight(
																									crit.weight,
																								),
																								4,
																							)}${weightMode === "percentage" ? "%" : ""}`
																							: "-"}
																						</td>
																					<td className="border p-2 text-center">
																										{formatNumber(
																												effectiveWeights[index] ?? 0,
																												4,
																											)}
																					</td>
																				</tr>
																		),
																		)}
																</tbody>
															</table>
														</div>
													</div>

													<div className="space-y-3">
														<h4 className="font-semibold">
															Langkah 6 :{" "}
															{
																methodStepDetails.step6Title
															}
															</h4>
														<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
															<code>
																{methodStepDetails.step6Formula.join(
																	"\n",
																)}
															</code>
														</pre>
														{methodStepDetails.step6Notes?.map(
															(
																note,
																index,
															) => (
																<p
																	key={`popup-step6-note-${index}`}
																	className="text-sm text-muted-foreground"
																>
																	{note}
																</p>
															),
															)}
														<div className="space-y-2">
															<p className="text-sm font-medium">
																{
																	methodStepDetails
																		.step6Table
																		.title
																}
															</p>
															<div className="overflow-x-auto">
																<table className="w-full border-collapse text-sm">
																	<thead>
																		<tr>
																			<th className="border p-2 text-left">
																				{methodStepDetails.step6Table.rowHeader ??
																					"Alternatif"}
																			</th>
																			{methodStepDetails.step6Table.headers.map(
																				(
																					header,
																				) => (
																					<th
																						key={`popup-step6-${header}`}
																						className="border p-2 text-center"
																					>
																						{header}
																					</th>
																					),
																				)}
																		</tr>
																	</thead>
																	<tbody>
																		{methodStepDetails.step6Table.rows.map(
																				(
																					row,
																					rowIndex,
																				) => (
																					<tr
																						key={`popup-step6-row-${rowIndex}`}
																					>
																						<td className="border p-2 font-medium">
																							{row.label}
																						</td>
																						{row.values.map(
																							(
																								value,
																								valueIndex,
																							) => (
																								<td
																									key={`popup-step6-${rowIndex}-${valueIndex}`}
																									className="border p-2 text-center"
																								>
																									{formatNumber(
																										value,
																										methodStepDetails
																												.step6Table
																												.digits ??
																												4,
																										)}
																								</td>
																							),
																						)}
																						</tr>
																					),
																					)}
																				</tbody>
																	</table>
															</div>
														</div>
													</div>

													<div className="space-y-2">
														<h4 className="font-semibold">
															Langkah 7 : Hasil
															</h4>
														<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
															<code>
																{method === "vikor"
																	? "Urutkan Q_i dari terkecil ke terbesar"
																	: "Urutkan skor dari terbesar ke terkecil"}
															</code>
														</pre>
														<table className="w-full border-collapse text-sm">
															<thead>
																<tr>
																	<th className="border p-2 text-center">
																		Rank
																	</th>
																	<th className="border p-2 text-left">
																		Alternatif
																	</th>
																	<th className="border p-2 text-center">
																		Skor
																	</th>
																</tr>
															</thead>
															<tbody>
																{results.map(
																	(r) => (
																		<tr
																			key={`popup-step7-${r.alternativeId}`}
																			>
																				<td className="border p-2 text-center font-bold">
																					{r.rank}
																				</td>
																					<td className="border p-2">
																						{r.alternativeName}
																					</td>
																					<td className="border p-2 text-center">
																						{formatNumber(
																							r.score,
																							6,
																						)}
																					</td>
																				</tr>
																		),
																	)}
																</tbody>
															</table>
														</div>
												</div>
											</div>
										</div>
									)}
								</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</main>
		)
	}

export default MatrixPage

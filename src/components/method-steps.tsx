import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	buildMatrix2d,
	formatNumber,
} from "@/features/decision/lib/methods"
import type {
	Criteria,
	Alternative,
	MatrixValue,
	RankingResult,
	MethodStepDetails,
} from "@/features/decision/lib/methods"

export interface Step5Row {
	name: string
	inputLabel: string
	usedLabel: string
}

interface MethodStepsExplorerProps {
	methodName: string
	methodStepDetails: MethodStepDetails
	criteria: Criteria[]
	alternatives: Alternative[]
	matrix: MatrixValue[]
	results: RankingResult[]
	isVikor?: boolean
	step5Note: string
	step5Formula?: string
	step5Rows: Step5Row[]
}

function FormulaBlock({ formula }: { formula: string }) {
	return (
		<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
			<code>{formula}</code>
		</pre>
	)
}

function StepTable({
	table,
	prefix,
}: {
	table: MethodStepDetails["step6Table"]
	prefix: string
}) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr>
						<th className="border p-2 text-left">
							{table.rowHeader ?? "Alternatif"}
						</th>
						{table.headers.map((header) => (
							<th
								key={`${prefix}-${header}`}
								className="border p-2 text-center"
							>
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{table.rows.map((row, rowIndex) => (
						<tr key={`${prefix}-${row.label}-${rowIndex}`}>
							<td className="border p-2 font-medium">{row.label}</td>
							{row.values.map((value, valueIndex) => (
								<td
									key={`${prefix}-${row.label}-${valueIndex}`}
									className="border p-2 text-center"
								>
									{formatNumber(value, table.digits ?? 4)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

/**
 * Penampil langkah-langkah perhitungan (langkah 1–7) + popup rumus.
 * Dipakai di MatrixPage (saat "Lihat Langkah Perhitungan") dan
 * HistoryDetail (dari matrixSnapshot analisis tersimpan).
 */
function MethodStepsExplorer({
	methodName,
	methodStepDetails,
	criteria,
	alternatives,
	matrix,
	results,
	isVikor = false,
	step5Note,
	step5Formula = "w_j' = w_j / sum_j w_j",
	step5Rows,
}: MethodStepsExplorerProps) {
	const [showFormulaPopup, setShowFormulaPopup] = useState(false)
	const stepMatrix = buildMatrix2d(criteria, alternatives, matrix)

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between gap-3">
					<span>Langkah-langkah Perhitungan {methodName}</span>
					<Button
						variant="outline"
						size="icon"
						className="h-7 w-7 text-xs font-bold"
						title="Lihat rumus dan hasil"
						aria-label="Lihat rumus dan hasil"
						onClick={() => setShowFormulaPopup(true)}
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
					<div className="mb-2">
						<FormulaBlock formula="A = {A_1, A_2, ..., A_m}" />
					</div>
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
					<div className="mb-2">
						<FormulaBlock formula="C = {C_1, C_2, ..., C_n}" />
					</div>
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
						Langkah 3 : Menentukan nilai setiap kriteria untuk setiap
						alternatif
					</h4>
					<div className="mb-2">
						<FormulaBlock formula="X = [x_ij], i = 1..m, j = 1..n" />
					</div>
					<StepTable
						table={{
							title: "Matriks keputusan",
							headers: criteria.map((c) => c.name),
							rows: alternatives.map((alt, i) => ({
								label: alt.name,
								values: stepMatrix[i] ?? [],
							})),
						}}
						prefix="step3"
					/>
				</div>

				<div className="space-y-3">
					<h4 className="mb-2 font-semibold">
						Langkah 4 : {methodStepDetails.step4Title}
					</h4>
					<div className="mb-2">
						<FormulaBlock formula={methodStepDetails.step4Formula.join("\n")} />
					</div>
					<p className="text-sm text-muted-foreground">
						Rumus tersedia di tombol "!".
					</p>
					{methodStepDetails.step4Notes?.map((note, index) => (
						<p
							key={`${note}-${index}`}
							className="text-sm text-muted-foreground"
						>
							{note}
						</p>
					))}
					{methodStepDetails.step4Tables.map((table, tableIndex) => (
						<div key={`${table.title}-${tableIndex}`} className="space-y-2">
							<p className="text-sm font-medium">{table.title}</p>
							<StepTable table={table} prefix={`step4-${tableIndex}`} />
						</div>
					))}
				</div>

				<div>
					<h4 className="mb-2 font-semibold">
						Langkah 5 : Menentukan bobot setiap kriteria
					</h4>
					<div className="mb-2">
						<FormulaBlock formula={step5Formula} />
					</div>
					<p className="mb-2 text-sm text-muted-foreground">{step5Note}</p>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-sm">
							<thead>
								<tr>
									<th className="border p-2 text-left">Kriteria</th>
									<th className="border p-2 text-center">
										Bobot input
									</th>
									<th className="border p-2 text-center">
										Bobot dipakai (w_j)
									</th>
								</tr>
							</thead>
							<tbody>
								{step5Rows.map((row) => (
									<tr key={row.name}>
										<td className="border p-2">{row.name}</td>
										<td className="border p-2 text-center">
											{row.inputLabel}
										</td>
										<td className="border p-2 text-center">
											{row.usedLabel}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className="space-y-3">
					<h4 className="mb-2 font-semibold">
						Langkah 6 : {methodStepDetails.step6Title}
					</h4>
					<div className="mb-2">
						<FormulaBlock formula={methodStepDetails.step6Formula.join("\n")} />
					</div>
					<p className="text-sm text-muted-foreground">
						Rumus tersedia di tombol "!".
					</p>
					{methodStepDetails.step6Notes?.map((note, index) => (
						<p
							key={`${note}-${index}`}
							className="text-sm text-muted-foreground"
						>
							{note}
						</p>
					))}
					<div className="space-y-2">
						<p className="text-sm font-medium">
							{methodStepDetails.step6Table.title}
						</p>
						<StepTable table={methodStepDetails.step6Table} prefix="step6" />
					</div>
				</div>

				<div>
					<h4 className="mb-2 font-semibold">Langkah 7 : Hasil</h4>
					<div className="mb-2">
						<FormulaBlock
							formula={
								isVikor
									? "Urutkan Q_i dari terkecil ke terbesar"
									: "Urutkan skor dari terbesar ke terkecil"
							}
						/>
					</div>
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr>
								<th className="border p-2 text-center">Rank</th>
								<th className="border p-2 text-left">Alternatif</th>
								<th className="border p-2 text-center">Skor</th>
							</tr>
						</thead>
						<tbody>
							{results.map((r) => (
								<tr key={r.alternativeId}>
									<td className="border p-2 text-center font-bold">
										{r.rank}
									</td>
									<td className="border p-2">{r.alternativeName}</td>
									<td className="border p-2 text-center">
										{formatNumber(r.score, 6)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>

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
								Rumus & Hasil Perhitungan {methodName}
							</h3>
							<Button
								variant="outline"
								onClick={() => setShowFormulaPopup(false)}
							>
								Tutup
							</Button>
						</div>

						<div className="space-y-6">
							<div className="space-y-2">
								<h4 className="font-semibold">
									Langkah 1 : Menentukan alternatif
								</h4>
								<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
									<code>A = {"{A_1, A_2, ..., A_m}"}</code>
								</pre>
								<p className="text-sm text-muted-foreground">
									m = {alternatives.length} alternatif:{" "}
									{alternatives.map((alt) => alt.name).join(", ")}
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-semibold">
									Langkah 2 : Menentukan kriteria
								</h4>
								<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
									<code>C = {"{C_1, C_2, ..., C_n}"}</code>
								</pre>
								<p className="text-sm text-muted-foreground">
									n = {criteria.length} kriteria:{" "}
									{criteria
										.map((crit) => `${crit.name} (${crit.type})`)
										.join(", ")}
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-semibold">
									Langkah 3 : Menentukan nilai setiap kriteria untuk
									setiap alternatif
								</h4>
								<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
									<code>X = [x_ij], i = 1..m, j = 1..n</code>
								</pre>
								<StepTable
									table={{
										title: "Matriks keputusan",
										headers: criteria.map((c) => c.name),
										rows: alternatives.map((alt, i) => ({
											label: alt.name,
											values: stepMatrix[i] ?? [],
										})),
									}}
									prefix="popup-step3"
								/>
							</div>

							<div className="space-y-3">
								<h4 className="font-semibold">
									Langkah 4 : {methodStepDetails.step4Title}
								</h4>
								<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
									<code>
										{methodStepDetails.step4Formula.join("\n")}
									</code>
								</pre>
								{methodStepDetails.step4Notes?.map((note, index) => (
									<p
										key={`popup-step4-note-${index}`}
										className="text-sm text-muted-foreground"
									>
										{note}
									</p>
								))}
								{methodStepDetails.step4Tables.map(
									(table, tableIndex) => (
										<div
											key={`popup-step4-table-${tableIndex}`}
											className="space-y-2"
										>
											<p className="text-sm font-medium">
												{table.title}
											</p>
											<StepTable
												table={table}
												prefix={`popup-step4-${tableIndex}`}
											/>
										</div>
									),
								)}
							</div>

							<div className="space-y-2">
								<h4 className="font-semibold">
									Langkah 5 : Menentukan bobot setiap kriteria
								</h4>
								<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
									<code>w_j = w_j / sum_j w_j</code>
								</pre>
								<p className="text-sm text-muted-foreground">
									{step5Note}
								</p>
								<StepTable
									table={{
										title: "Bobot kriteria",
										headers: ["Bobot input", "Bobot dipakai (w_j)"],
										rows: step5Rows.map((row) => ({
											label: row.name,
											values: [
												Number.parseFloat(row.inputLabel) || 0,
												Number.parseFloat(row.usedLabel) || 0,
											],
										})),
									}}
									prefix="popup-step5"
								/>
							</div>

							<div className="space-y-3">
								<h4 className="font-semibold">
									Langkah 6 : {methodStepDetails.step6Title}
								</h4>
								<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
									<code>
										{methodStepDetails.step6Formula.join("\n")}
									</code>
								</pre>
								{methodStepDetails.step6Notes?.map((note, index) => (
									<p
										key={`popup-step6-note-${index}`}
										className="text-sm text-muted-foreground"
									>
										{note}
									</p>
								))}
								<StepTable
									table={methodStepDetails.step6Table}
									prefix="popup-step6"
								/>
							</div>

							<div className="space-y-2">
								<h4 className="font-semibold">Langkah 7 : Hasil</h4>
								<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
									<code>
										{isVikor
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
										{results.map((r) => (
											<tr key={`popup-step7-${r.alternativeId}`}>
												<td className="border p-2 text-center font-bold">
													{r.rank}
												</td>
												<td className="border p-2">
													{r.alternativeName}
												</td>
												<td className="border p-2 text-center">
													{formatNumber(r.score, 6)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			)}
		</Card>
	)
}

export default MethodStepsExplorer

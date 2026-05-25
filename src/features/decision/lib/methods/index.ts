import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { normalizeWeights } from "./shared"
import { runTopsis, createTopsisStepDetails } from "./topsis"
import { runEdas, createEdasStepDetails } from "./edas"
import { runPsi, createPsiStepDetails } from "./psi"
import { runMoora, createMooraStepDetails } from "./moora"
import { runVikor, createVikorStepDetails } from "./vikor"
import { runAhp, createAhpStepDetails } from "./ahp"
import { runCopras, createCoprasStepDetails } from "./copras"
import { runPromethee, createPrometheeStepDetails } from "./promethee"
import { runElectre, createElectreStepDetails } from "./electre"

export type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails, StepTable } from "./shared"
export {
	formatNumber,
	buildMatrix2d,
	buildEqualWeights,
	normalizeWeights,
	buildStepRows,
	createZeroMatrix,
} from "./shared"

export const METHOD_NAMES: Record<string, string> = {
	topsis: "TOPSIS",
	ahp: "AHP",
	edas: "EDAS",
	psi: "PSI",
	vikor: "VIKOR",
	moora: "MOORA",
	electre: "ELECTRE",
	promethee: "PROMETHEE",
	copras: "COPRAS",
}

export function runMethod(
	method: string,
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	weights: number[],
): RankingResult[] {
	const calculationWeights = normalizeWeights(weights, criteria.length)

	switch (method) {
		case "topsis":
			return runTopsis(criteria, alternatives, matrix, calculationWeights)
		case "edas":
			return runEdas(criteria, alternatives, matrix, calculationWeights)
		case "psi":
			return runPsi(criteria, alternatives, matrix, calculationWeights)
		case "moora":
			return runMoora(criteria, alternatives, matrix, calculationWeights)
		case "vikor":
			return runVikor(criteria, alternatives, matrix, calculationWeights)
		case "ahp":
			return runAhp(criteria, alternatives, matrix, calculationWeights)
		case "copras":
			return runCopras(criteria, alternatives, matrix, calculationWeights)
		case "promethee":
			return runPromethee(criteria, alternatives, matrix, calculationWeights)
		case "electre":
			return runElectre(criteria, alternatives, matrix, calculationWeights)
		default:
			return runTopsis(criteria, alternatives, matrix, calculationWeights)
	}
}

export function createMethodStepDetails(
	method: string,
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	inputWeights: number[],
): MethodStepDetails {
	if (criteria.length === 0 || alternatives.length === 0) {
		return {
			step4Title: "Normalisasi nilai",
			step4Formula: ["Tambahkan minimal 1 alternatif dan 1 kriteria untuk melihat langkah perhitungan."],
			step4Tables: [],
			step6Title: "Menghitung nilai alternatif",
			step6Formula: ["Belum ada data untuk dihitung."],
			step6Table: {
				title: "Nilai alternatif",
				headers: ["Skor"],
				rows: [],
			},
		}
	}

	switch (method) {
		case "topsis":
			return createTopsisStepDetails(criteria, alternatives, matrix, inputWeights)
		case "edas":
			return createEdasStepDetails(criteria, alternatives, matrix, inputWeights)
		case "psi":
			return createPsiStepDetails(criteria, alternatives, matrix, inputWeights)
		case "moora":
			return createMooraStepDetails(criteria, alternatives, matrix, inputWeights)
		case "vikor":
			return createVikorStepDetails(criteria, alternatives, matrix, inputWeights)
		case "ahp":
			return createAhpStepDetails(criteria, alternatives, matrix, inputWeights)
		case "copras":
			return createCoprasStepDetails(criteria, alternatives, matrix, inputWeights)
		case "promethee":
			return createPrometheeStepDetails(criteria, alternatives, matrix, inputWeights)
		case "electre":
			return createElectreStepDetails(criteria, alternatives, matrix, inputWeights)
		default:
			return createTopsisStepDetails(criteria, alternatives, matrix, inputWeights)
	}
}

import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2, ListChecks, Calculator, Save, Play, FileText } from "lucide-react"

interface Criteria {
  id: string
  name: string
  type: "benefit" | "cost"
  weight: number
}

type WeightInputMode = "percentage" | "decimal"

interface Alternative {
  id: string
  name: string
}

interface MatrixValue {
  alternativeId: string
  criteriaId: string
  value: number
}

interface RankingResult {
  alternativeId: string
  alternativeName: string
  score: number
  rank: number
}

interface StepTable {
  title: string
  headers: string[]
  rows: Array<{
    label: string
    values: number[]
  }>
  rowHeader?: string
  digits?: number
}

interface MethodStepDetails {
  step4Title: string
  step4Formula: string[]
  step4Tables: StepTable[]
  step4Notes?: string[]
  step6Title: string
  step6Formula: string[]
  step6Table: StepTable
  step6Notes?: string[]
}

function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) {
    return "-"
  }
  return value.toFixed(digits)
}

function buildMatrix2d(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): number[][] {
  const matrix2d: number[][] = Array(alternatives.length).fill(null).map(() => Array(criteria.length).fill(0))
  matrix.forEach((m) => {
    const altIdx = alternatives.findIndex((a) => a.id === m.alternativeId)
    const critIdx = criteria.findIndex((c) => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })
  return matrix2d
}

function buildEqualWeights(nCriteria: number): number[] {
  if (nCriteria === 0) {
    return []
  }
  return Array(nCriteria).fill(1 / nCriteria)
}

function normalizeWeights(weights: number[], fallbackCount: number): number[] {
  if (fallbackCount === 0) {
    return []
  }

  const sanitized = weights.map((weight) => {
    if (!Number.isFinite(weight)) {
      return 0
    }
    return Math.max(0, weight)
  })

  const total = sanitized.reduce((acc, weight) => acc + weight, 0)
  if (total <= 0) {
    return buildEqualWeights(fallbackCount)
  }

  return sanitized.map((weight) => weight / total)
}

function buildStepRows(alternatives: Alternative[], values: number[][]): StepTable["rows"] {
  return alternatives.map((alt, i) => ({
    label: alt.name,
    values: values[i] ?? [],
  }))
}

function createMethodStepDetails(
  method: string,
  criteria: Criteria[],
  alternatives: Alternative[],
  matrix: MatrixValue[],
  inputWeights: number[]
): MethodStepDetails {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const headers = criteria.map((c) => c.name)
  const matrix2d = buildMatrix2d(criteria, alternatives, matrix)
  const weights = normalizeWeights(inputWeights, nCriteria)

  if (nCriteria === 0 || nAlternatives === 0) {
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

  const createZeroMatrix = () => Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0)) as number[][]

  switch (method) {
    case "topsis": {
      const normalized = createZeroMatrix()
      for (let j = 0; j < nCriteria; j++) {
        let sum = 0
        for (let i = 0; i < nAlternatives; i++) {
          sum += matrix2d[i][j] ** 2
        }
        const divider = Math.sqrt(sum)
        for (let i = 0; i < nAlternatives; i++) {
          normalized[i][j] = divider === 0 ? 0 : matrix2d[i][j] / divider
        }
      }

      const weighted = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          weighted[i][j] = normalized[i][j] * weights[j]
        }
      }

      const idealPositive: number[] = []
      const idealNegative: number[] = []
      for (let j = 0; j < nCriteria; j++) {
        if (criteria[j].type === "benefit") {
          idealPositive[j] = Math.max(...weighted.map((row) => row[j]))
          idealNegative[j] = Math.min(...weighted.map((row) => row[j]))
        } else {
          idealPositive[j] = Math.min(...weighted.map((row) => row[j]))
          idealNegative[j] = Math.max(...weighted.map((row) => row[j]))
        }
      }

      const distancePlus: number[] = []
      const distanceMinus: number[] = []
      const scoreRows: number[][] = []
      for (let i = 0; i < nAlternatives; i++) {
        let sumPlus = 0
        let sumMinus = 0
        for (let j = 0; j < nCriteria; j++) {
          sumPlus += (weighted[i][j] - idealPositive[j]) ** 2
          sumMinus += (weighted[i][j] - idealNegative[j]) ** 2
        }
        distancePlus[i] = Math.sqrt(sumPlus)
        distanceMinus[i] = Math.sqrt(sumMinus)
        const ci = (distancePlus[i] + distanceMinus[i]) === 0 ? 0 : distanceMinus[i] / (distancePlus[i] + distanceMinus[i])
        scoreRows.push([distancePlus[i], distanceMinus[i], ci])
      }

      return {
        step4Title: "Normalisasi nilai setiap kriteria (Euclidean)",
        step4Formula: [
          "r_ij = x_ij / sqrt(sum_i x_ij^2)",
        ],
        step4Tables: [
          {
            title: "Matriks normalisasi (R)",
            headers,
            rows: buildStepRows(alternatives, normalized),
          },
        ],
        step6Title: "Menghitung nilai alternatif (TOPSIS)",
        step6Formula: [
          "v_ij = w_j * r_ij",
          "A_j+ = max(v_ij) untuk benefit, min(v_ij) untuk cost",
          "A_j- = min(v_ij) untuk benefit, max(v_ij) untuk cost",
          "D_i+ = sqrt(sum_j (v_ij - A_j+)^2)",
          "D_i- = sqrt(sum_j (v_ij - A_j-)^2)",
          "C_i = D_i- / (D_i+ + D_i-)",
        ],
        step6Notes: [
          `A+: ${criteria.map((c, j) => `${c.name}=${formatNumber(idealPositive[j])}`).join(", ")}`,
          `A-: ${criteria.map((c, j) => `${c.name}=${formatNumber(idealNegative[j])}`).join(", ")}`,
        ],
        step6Table: {
          title: "Nilai kedekatan relatif (C_i)",
          headers: ["D+", "D-", "C_i"],
          rows: buildStepRows(alternatives, scoreRows),
        },
      }
    }

    case "edas": {
      const avg: number[] = []
      for (let j = 0; j < nCriteria; j++) {
        let total = 0
        for (let i = 0; i < nAlternatives; i++) {
          total += matrix2d[i][j]
        }
        avg[j] = total / nAlternatives
      }

      const pda = createZeroMatrix()
      const nda = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          if (avg[j] === 0) {
            pda[i][j] = 0
            nda[i][j] = 0
            continue
          }
          if (criteria[j].type === "benefit") {
            pda[i][j] = Math.max(0, (matrix2d[i][j] - avg[j]) / avg[j])
            nda[i][j] = Math.max(0, (avg[j] - matrix2d[i][j]) / avg[j])
          } else {
            pda[i][j] = Math.max(0, (avg[j] - matrix2d[i][j]) / avg[j])
            nda[i][j] = Math.max(0, (matrix2d[i][j] - avg[j]) / avg[j])
          }
        }
      }

      const sp: number[] = Array(nAlternatives).fill(0)
      const sn: number[] = Array(nAlternatives).fill(0)
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          sp[i] += weights[j] * pda[i][j]
          sn[i] += weights[j] * nda[i][j]
        }
      }

      const maxSp = Math.max(...sp)
      const maxSn = Math.max(...sn)
      const scoreRows = alternatives.map((_, i) => {
        const nsp = maxSp === 0 ? 0 : sp[i] / maxSp
        const nsn = maxSn === 0 ? 1 : 1 - (sn[i] / maxSn)
        const as = (nsp + nsn) / 2
        return [sp[i], sn[i], nsp, nsn, as]
      })

      return {
        step4Title: "Normalisasi/deviasi terhadap rata-rata (EDAS)",
        step4Formula: [
          "AV_j = (1/m) * sum_i x_ij",
          "PDA_ij = max(0, (x_ij - AV_j)/AV_j) untuk benefit",
          "PDA_ij = max(0, (AV_j - x_ij)/AV_j) untuk cost",
          "NDA_ij = max(0, (AV_j - x_ij)/AV_j) untuk benefit",
          "NDA_ij = max(0, (x_ij - AV_j)/AV_j) untuk cost",
        ],
        step4Tables: [
          {
            title: "Rata-rata tiap kriteria (AV)",
            rowHeader: "Statistik",
            headers,
            rows: [
              {
                label: "AV",
                values: avg,
              },
            ],
          },
          {
            title: "Positive Distance from Average (PDA)",
            headers,
            rows: buildStepRows(alternatives, pda),
          },
          {
            title: "Negative Distance from Average (NDA)",
            headers,
            rows: buildStepRows(alternatives, nda),
          },
        ],
        step6Title: "Menghitung nilai alternatif (EDAS)",
        step6Formula: [
          "SP_i = sum_j (w_j * PDA_ij)",
          "SN_i = sum_j (w_j * NDA_ij)",
          "NSP_i = SP_i / max(SP)",
          "NSN_i = 1 - (SN_i / max(SN))",
          "AS_i = (NSP_i + NSN_i) / 2",
        ],
        step6Table: {
          title: "Skor akhir EDAS",
          headers: ["SP", "SN", "NSP", "NSN", "AS_i"],
          rows: buildStepRows(alternatives, scoreRows),
        },
      }
    }

    case "psi": {
      const minVal: number[] = []
      const maxVal: number[] = []
      for (let j = 0; j < nCriteria; j++) {
        minVal[j] = Math.min(...matrix2d.map((row) => row[j]))
        maxVal[j] = Math.max(...matrix2d.map((row) => row[j]))
      }

      const normalized = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          const range = maxVal[j] - minVal[j]
          if (range === 0) {
            normalized[i][j] = 0
          } else if (criteria[j].type === "benefit") {
            normalized[i][j] = (matrix2d[i][j] - minVal[j]) / range
          } else {
            normalized[i][j] = (maxVal[j] - matrix2d[i][j]) / range
          }
        }
      }

      const colSum: number[] = Array(nCriteria).fill(0)
      for (let j = 0; j < nCriteria; j++) {
        for (let i = 0; i < nAlternatives; i++) {
          colSum[j] += normalized[i][j]
        }
      }

      const relativePref = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          relativePref[i][j] = colSum[j] === 0 ? 0 : normalized[i][j] / colSum[j]
        }
      }

      const step6Rows = alternatives.map((_, i) => {
        const prefTotal = relativePref[i].reduce((acc, value) => acc + value, 0)
        const psiScore = relativePref[i].reduce((acc, value, j) => acc + (weights[j] * value), 0)
        return [prefTotal, psiScore]
      })

      return {
        step4Title: "Normalisasi nilai setiap kriteria (Min-Max)",
        step4Formula: [
          "n_ij = (x_ij - min_j) / (max_j - min_j) untuk benefit",
          "n_ij = (max_j - x_ij) / (max_j - min_j) untuk cost",
        ],
        step4Tables: [
          {
            title: "Matriks normalisasi (N)",
            headers,
            rows: buildStepRows(alternatives, normalized),
          },
        ],
        step6Title: "Menghitung nilai alternatif (PSI)",
        step6Formula: [
          "P_ij = n_ij / sum_i n_ij",
          "PSI_i = sum_j (w_j * P_ij)",
        ],
        step6Table: {
          title: "Skor akhir PSI",
          headers: ["sum_j P_ij", "PSI_i"],
          rows: buildStepRows(alternatives, step6Rows),
        },
      }
    }

    case "moora": {
      const normalized = createZeroMatrix()
      for (let j = 0; j < nCriteria; j++) {
        let sum = 0
        for (let i = 0; i < nAlternatives; i++) {
          sum += matrix2d[i][j] ** 2
        }
        const divider = Math.sqrt(sum)
        for (let i = 0; i < nAlternatives; i++) {
          normalized[i][j] = divider === 0 ? 0 : matrix2d[i][j] / divider
        }
      }

      const weighted = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          weighted[i][j] = normalized[i][j] * weights[j]
        }
      }

      const step6Rows = alternatives.map((_, i) => {
        let benefit = 0
        let cost = 0
        for (let j = 0; j < nCriteria; j++) {
          if (criteria[j].type === "benefit") {
            benefit += weighted[i][j]
          } else {
            cost += weighted[i][j]
          }
        }
        return [benefit, cost, benefit - cost]
      })

      return {
        step4Title: "Normalisasi nilai setiap kriteria (Euclidean)",
        step4Formula: [
          "r_ij = x_ij / sqrt(sum_i x_ij^2)",
        ],
        step4Tables: [
          {
            title: "Matriks normalisasi (R)",
            headers,
            rows: buildStepRows(alternatives, normalized),
          },
        ],
        step6Title: "Menghitung nilai alternatif (MOORA)",
        step6Formula: [
          "v_ij = w_j * r_ij",
          "Y_i = sum(v_ij) untuk benefit - sum(v_ij) untuk cost",
        ],
        step6Table: {
          title: "Indeks MOORA (Y_i)",
          headers: ["sum Benefit", "sum Cost", "Y_i"],
          rows: buildStepRows(alternatives, step6Rows),
        },
      }
    }

    case "vikor": {
      const fStar: number[] = []
      const fMinus: number[] = []
      for (let j = 0; j < nCriteria; j++) {
        const column = matrix2d.map((row) => row[j])
        const max = Math.max(...column)
        const min = Math.min(...column)
        if (criteria[j].type === "benefit") {
          fStar[j] = max
          fMinus[j] = min
        } else {
          fStar[j] = min
          fMinus[j] = max
        }
      }

      const normalized = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          const divider = fStar[j] - fMinus[j]
          if (divider === 0) {
            normalized[i][j] = 0
          } else if (criteria[j].type === "benefit") {
            normalized[i][j] = (fStar[j] - matrix2d[i][j]) / divider
          } else {
            normalized[i][j] = (matrix2d[i][j] - fStar[j]) / (fMinus[j] - fStar[j])
          }
        }
      }

      const s: number[] = Array(nAlternatives).fill(0)
      const r: number[] = Array(nAlternatives).fill(0)
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          const value = weights[j] * normalized[i][j]
          s[i] += value
          r[i] = Math.max(r[i], value)
        }
      }

      const sBest = Math.min(...s)
      const sWorst = Math.max(...s)
      const rBest = Math.min(...r)
      const rWorst = Math.max(...r)
      const v = 0.5

      const step6Rows = alternatives.map((_, i) => {
        const q = (v * (sWorst === sBest ? 0 : (s[i] - sBest) / (sWorst - sBest))) +
          ((1 - v) * (rWorst === rBest ? 0 : (r[i] - rBest) / (rWorst - rBest)))
        return [s[i], r[i], q]
      })

      return {
        step4Title: "Normalisasi terhadap solusi terbaik-terburuk (VIKOR)",
        step4Formula: [
          "f_j* = nilai terbaik, f_j- = nilai terburuk per kriteria",
          "r_ij = (f_j* - x_ij) / (f_j* - f_j-) untuk benefit",
          "r_ij = (x_ij - f_j*) / (f_j- - f_j*) untuk cost",
        ],
        step4Tables: [
          {
            title: "Matriks normalisasi VIKOR (r_ij)",
            headers,
            rows: buildStepRows(alternatives, normalized),
          },
        ],
        step4Notes: [
          `f*: ${criteria.map((c, j) => `${c.name}=${formatNumber(fStar[j])}`).join(", ")}`,
          `f-: ${criteria.map((c, j) => `${c.name}=${formatNumber(fMinus[j])}`).join(", ")}`,
        ],
        step6Title: "Menghitung nilai alternatif (VIKOR)",
        step6Formula: [
          "S_i = sum_j (w_j * r_ij)",
          "R_i = max_j (w_j * r_ij)",
          "Q_i = v * (S_i - S*)/(S- - S*) + (1-v) * (R_i - R*)/(R- - R*)",
          "v = 0.5 pada implementasi ini",
        ],
        step6Table: {
          title: "Indeks kompromi VIKOR (Q_i)",
          headers: ["S_i", "R_i", "Q_i"],
          rows: buildStepRows(alternatives, step6Rows),
        },
      }
    }

    case "ahp": {
      const normalized = createZeroMatrix()
      for (let j = 0; j < nCriteria; j++) {
        let sum = 0
        for (let i = 0; i < nAlternatives; i++) {
          sum += matrix2d[i][j]
        }
        for (let i = 0; i < nAlternatives; i++) {
          normalized[i][j] = sum === 0 ? 0 : matrix2d[i][j] / sum
        }
      }

      const step6Rows = alternatives.map((_, i) => {
        let score = 0
        for (let j = 0; j < nCriteria; j++) {
          score += normalized[i][j] * weights[j]
        }
        return [score]
      })

      return {
        step4Title: "Normalisasi nilai setiap kriteria (AHP sederhana)",
        step4Formula: [
          "n_ij = x_ij / sum_i x_ij",
        ],
        step4Tables: [
          {
            title: "Matriks normalisasi (N)",
            headers,
            rows: buildStepRows(alternatives, normalized),
          },
        ],
        step4Notes: [
          "Catatan: AHP penuh membutuhkan matriks perbandingan berpasangan. Implementasi halaman ini memakai pendekatan normalisasi matriks keputusan.",
        ],
        step6Title: "Menghitung nilai alternatif (AHP sederhana)",
        step6Formula: [
          "A_i = sum_j (w_j * n_ij)",
        ],
        step6Table: {
          title: "Skor alternatif",
          headers: ["A_i"],
          rows: buildStepRows(alternatives, step6Rows),
        },
      }
    }

    case "copras": {
      const colSum: number[] = Array(nCriteria).fill(0)
      for (let j = 0; j < nCriteria; j++) {
        for (let i = 0; i < nAlternatives; i++) {
          colSum[j] += matrix2d[i][j]
        }
      }

      const normalized = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          normalized[i][j] = colSum[j] === 0 ? 0 : matrix2d[i][j] / colSum[j]
        }
      }

      const weighted = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          weighted[i][j] = normalized[i][j] * weights[j]
        }
      }

      const sPlus: number[] = Array(nAlternatives).fill(0)
      const sMinus: number[] = Array(nAlternatives).fill(0)
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          if (criteria[j].type === "benefit") {
            sPlus[i] += weighted[i][j]
          } else {
            sMinus[i] += weighted[i][j]
          }
        }
      }

      const hasCost = criteria.some((c) => c.type === "cost")
      const safeSMinus = sMinus.map((value) => value <= 0 ? Number.EPSILON : value)
      const sumSMinus = safeSMinus.reduce((acc, value) => acc + value, 0)
      const sumInvSMinus = safeSMinus.reduce((acc, value) => acc + (1 / value), 0)

      const q: number[] = alternatives.map((_, i) => {
        if (!hasCost || sumInvSMinus === 0) {
          return sPlus[i]
        }
        return sPlus[i] + (sumSMinus / (safeSMinus[i] * sumInvSMinus))
      })
      const qMax = Math.max(...q)

      const step6Rows = alternatives.map((_, i) => [
        sPlus[i],
        sMinus[i],
        q[i],
        qMax === 0 ? 0 : (q[i] / qMax) * 100,
      ])

      return {
        step4Title: "Normalisasi nilai setiap kriteria (proposional COPRAS)",
        step4Formula: [
          "n_ij = x_ij / sum_i x_ij",
          "q_ij = w_j * n_ij",
        ],
        step4Tables: [
          {
            title: "Matriks normalisasi (N)",
            headers,
            rows: buildStepRows(alternatives, normalized),
          },
          {
            title: "Matriks terboboti (Q)",
            headers,
            rows: buildStepRows(alternatives, weighted),
          },
        ],
        step6Title: "Menghitung nilai alternatif (COPRAS)",
        step6Formula: [
          "S_i+ = sum_j q_ij untuk kriteria benefit",
          "S_i- = sum_j q_ij untuk kriteria cost",
          "Q_i = S_i+ + (sum_i S_i-) / (S_i- * sum_i (1 / S_i-))",
          "U_i = (Q_i / Q_max) * 100%",
        ],
        step6Notes: hasCost ? undefined : ["Tidak ada kriteria cost, sehingga Q_i = S_i+."],
        step6Table: {
          title: "Signifikansi relatif dan utility",
          headers: ["S+", "S-", "Q_i", "U_i (%)"],
          rows: buildStepRows(alternatives, step6Rows),
        },
      }
    }

    case "promethee": {
      const minVal: number[] = []
      const maxVal: number[] = []
      for (let j = 0; j < nCriteria; j++) {
        minVal[j] = Math.min(...matrix2d.map((row) => row[j]))
        maxVal[j] = Math.max(...matrix2d.map((row) => row[j]))
      }

      const normalizedReference = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          const range = maxVal[j] - minVal[j]
          if (range === 0) {
            normalizedReference[i][j] = 0
          } else if (criteria[j].type === "benefit") {
            normalizedReference[i][j] = (matrix2d[i][j] - minVal[j]) / range
          } else {
            normalizedReference[i][j] = (maxVal[j] - matrix2d[i][j]) / range
          }
        }
      }

      const pref: number[][][] = Array(nAlternatives).fill(null).map(() =>
        Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
      )
      for (let i = 0; i < nAlternatives; i++) {
        for (let k = 0; k < nAlternatives; k++) {
          if (i === k) {
            continue
          }
          for (let j = 0; j < nCriteria; j++) {
            const range = maxVal[j] - minVal[j]
            if (range === 0) {
              pref[i][k][j] = 0
              continue
            }
            const delta = criteria[j].type === "benefit"
              ? matrix2d[i][j] - matrix2d[k][j]
              : matrix2d[k][j] - matrix2d[i][j]
            pref[i][k][j] = Math.max(0, delta / range)
          }
        }
      }

      const pi: number[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(0))
      for (let i = 0; i < nAlternatives; i++) {
        for (let k = 0; k < nAlternatives; k++) {
          if (i === k) {
            continue
          }
          for (let j = 0; j < nCriteria; j++) {
            pi[i][k] += weights[j] * pref[i][k][j]
          }
        }
      }

      const phiPlus: number[] = Array(nAlternatives).fill(0)
      const phiMinus: number[] = Array(nAlternatives).fill(0)
      const divider = nAlternatives > 1 ? (nAlternatives - 1) : 1
      for (let i = 0; i < nAlternatives; i++) {
        for (let k = 0; k < nAlternatives; k++) {
          if (i !== k) {
            phiPlus[i] += pi[i][k]
            phiMinus[i] += pi[k][i]
          }
        }
        phiPlus[i] /= divider
        phiMinus[i] /= divider
      }

      const step6Rows = alternatives.map((_, i) => [
        phiPlus[i],
        phiMinus[i],
        phiPlus[i] - phiMinus[i],
      ])

      return {
        step4Title: "Normalisasi rentang untuk fungsi preferensi (PROMETHEE)",
        step4Formula: [
          "range_j = max_j - min_j",
          "d_j(a,b) = x_aj - x_bj untuk benefit, x_bj - x_aj untuk cost",
          "P_j(a,b) = max(0, d_j(a,b) / range_j)",
        ],
        step4Tables: [
          {
            title: "Matriks referensi Min-Max (untuk melihat rentang)",
            headers,
            rows: buildStepRows(alternatives, normalizedReference),
          },
        ],
        step6Title: "Menghitung nilai alternatif (PROMETHEE)",
        step6Formula: [
          "pi(a,b) = sum_j (w_j * P_j(a,b))",
          "phi+(a) = (1/(m-1)) * sum_{b!=a} pi(a,b)",
          "phi-(a) = (1/(m-1)) * sum_{b!=a} pi(b,a)",
          "phi(a) = phi+(a) - phi-(a)",
        ],
        step6Table: {
          title: "Outranking flow",
          headers: ["phi+", "phi-", "phi"],
          rows: buildStepRows(alternatives, step6Rows),
        },
      }
    }

    case "electre": {
      const minVal: number[] = []
      const maxVal: number[] = []
      for (let j = 0; j < nCriteria; j++) {
        minVal[j] = Math.min(...matrix2d.map((row) => row[j]))
        maxVal[j] = Math.max(...matrix2d.map((row) => row[j]))
      }

      const normalized = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          const range = maxVal[j] - minVal[j]
          if (range === 0) {
            normalized[i][j] = 0
          } else if (criteria[j].type === "benefit") {
            normalized[i][j] = (matrix2d[i][j] - minVal[j]) / range
          } else {
            normalized[i][j] = (maxVal[j] - matrix2d[i][j]) / range
          }
        }
      }

      const weighted = createZeroMatrix()
      for (let i = 0; i < nAlternatives; i++) {
        for (let j = 0; j < nCriteria; j++) {
          weighted[i][j] = normalized[i][j] * weights[j]
        }
      }

      const concordance: number[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(0))
      const discordance: number[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(0))
      for (let i = 0; i < nAlternatives; i++) {
        for (let k = 0; k < nAlternatives; k++) {
          if (i === k) {
            continue
          }
          let concordanceValue = 0
          let maxDiffAll = 0
          let maxDiffDisadvantage = 0
          for (let j = 0; j < nCriteria; j++) {
            const diff = Math.abs(weighted[i][j] - weighted[k][j])
            maxDiffAll = Math.max(maxDiffAll, diff)
            if (weighted[i][j] >= weighted[k][j]) {
              concordanceValue += weights[j]
            } else {
              maxDiffDisadvantage = Math.max(maxDiffDisadvantage, diff)
            }
          }
          concordance[i][k] = concordanceValue
          discordance[i][k] = maxDiffAll === 0 ? 0 : maxDiffDisadvantage / maxDiffAll
        }
      }

      let pairCount = 0
      let concTotal = 0
      let discTotal = 0
      for (let i = 0; i < nAlternatives; i++) {
        for (let k = 0; k < nAlternatives; k++) {
          if (i !== k) {
            pairCount += 1
            concTotal += concordance[i][k]
            discTotal += discordance[i][k]
          }
        }
      }
      const thresholdConc = pairCount === 0 ? 0 : concTotal / pairCount
      const thresholdDisc = pairCount === 0 ? 0 : discTotal / pairCount

      const outrank: boolean[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(false))
      for (let i = 0; i < nAlternatives; i++) {
        for (let k = 0; k < nAlternatives; k++) {
          if (i !== k && concordance[i][k] >= thresholdConc && discordance[i][k] <= thresholdDisc) {
            outrank[i][k] = true
          }
        }
      }

      const divider = nAlternatives > 1 ? (nAlternatives - 1) : 1
      const step6Rows = alternatives.map((_, i) => {
        const avgConc = concordance[i].reduce((acc, value, k) => i === k ? acc : acc + value, 0) / divider
        const avgDisc = discordance[i].reduce((acc, value, k) => i === k ? acc : acc + value, 0) / divider
        const outrankCount = outrank[i].filter(Boolean).length
        return [avgConc, avgDisc, outrankCount]
      })

      return {
        step4Title: "Normalisasi nilai setiap kriteria (Min-Max ELECTRE)",
        step4Formula: [
          "r_ij = (x_ij - min_j)/(max_j - min_j) untuk benefit",
          "r_ij = (max_j - x_ij)/(max_j - min_j) untuk cost",
          "v_ij = w_j * r_ij",
        ],
        step4Tables: [
          {
            title: "Matriks normalisasi (R)",
            headers,
            rows: buildStepRows(alternatives, normalized),
          },
          {
            title: "Matriks terboboti (V)",
            headers,
            rows: buildStepRows(alternatives, weighted),
          },
        ],
        step6Title: "Menghitung nilai alternatif (ELECTRE)",
        step6Formula: [
          "C_ik = sum_j w_j untuk semua j dengan v_ij >= v_kj",
          "D_ik = max_{j:v_ij<v_kj}|v_ij-v_kj| / max_j|v_ij-v_kj|",
          "c* = rata-rata C_ik, d* = rata-rata D_ik",
          "i outrank k jika C_ik >= c* dan D_ik <= d*",
        ],
        step6Notes: [
          `Ambang concordance (c*): ${formatNumber(thresholdConc)}`,
          `Ambang discordance (d*): ${formatNumber(thresholdDisc)}`,
        ],
        step6Table: {
          title: "Ringkasan outranking per alternatif",
          headers: ["C_out", "D_out", "Outranking"],
          rows: buildStepRows(alternatives, step6Rows),
          digits: 4,
        },
      }
    }

    default:
      return createMethodStepDetails("topsis", criteria, alternatives, matrix, inputWeights)
  }
}

function topsis(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[], weights: number[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const normalizedWeights = normalizeWeights(weights, nCriteria)
  
  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  matrix.forEach(m => {
    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })

  const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let j = 0; j < nCriteria; j++) {
    let sum = 0
    for (let i = 0; i < nAlternatives; i++) {
      sum += matrix2d[i][j] ** 2
    }
    const sqrt = Math.sqrt(sum)
    for (let i = 0; i < nAlternatives; i++) {
      normalized[i][j] = sqrt === 0 ? 0 : matrix2d[i][j] / sqrt
    }
  }

  const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      weighted[i][j] = normalized[i][j] * normalizedWeights[j]
    }
  }

  const idealPositive: number[] = []
  const idealNegative: number[] = []
  for (let j = 0; j < nCriteria; j++) {
    if (criteria[j].type === "benefit") {
      idealPositive[j] = Math.max(...weighted.map(row => row[j]))
      idealNegative[j] = Math.min(...weighted.map(row => row[j]))
    } else {
      idealPositive[j] = Math.min(...weighted.map(row => row[j]))
      idealNegative[j] = Math.max(...weighted.map(row => row[j]))
    }
  }

  const distances: { plus: number[]; minus: number[] } = { plus: [], minus: [] }
  for (let i = 0; i < nAlternatives; i++) {
    let sumPlus = 0
    let sumMinus = 0
    for (let j = 0; j < nCriteria; j++) {
      sumPlus += (weighted[i][j] - idealPositive[j]) ** 2
      sumMinus += (weighted[i][j] - idealNegative[j]) ** 2
    }
    distances.plus.push(Math.sqrt(sumPlus))
    distances.minus.push(Math.sqrt(sumMinus))
  }

  const scores = alternatives.map((alt, i) => ({
    alternativeId: alt.id,
    alternativeName: alt.name,
    score: distances.minus[i] / (distances.plus[i] + distances.minus[i]),
    rank: 0
  }))

  scores.sort((a, b) => b.score - a.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

function edas(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[], weights: number[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const normalizedWeights = normalizeWeights(weights, nCriteria)
  
  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  matrix.forEach(m => {
    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })

  const avg: number[] = []
  for (let j = 0; j < nCriteria; j++) {
    let sum = 0
    for (let i = 0; i < nAlternatives; i++) {
      sum += matrix2d[i][j]
    }
    avg.push(sum / nAlternatives)
  }

  const pda: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  const nda: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      if (criteria[j].type === "benefit") {
        pda[i][j] = avg[j] === 0 ? 0 : (matrix2d[i][j] - avg[j]) / avg[j]
        nda[i][j] = avg[j] === 0 ? 0 : (avg[j] - matrix2d[i][j]) / avg[j]
      } else {
        pda[i][j] = avg[j] === 0 ? 0 : (avg[j] - matrix2d[i][j]) / avg[j]
        nda[i][j] = avg[j] === 0 ? 0 : (matrix2d[i][j] - avg[j]) / avg[j]
      }
    }
  }

  const sp: number[] = Array(nAlternatives).fill(0)
  const sn: number[] = Array(nAlternatives).fill(0)
  
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      sp[i] += normalizedWeights[j] * Math.max(0, pda[i][j])
      sn[i] += normalizedWeights[j] * Math.max(0, nda[i][j])
    }
  }

  const maxSp = Math.max(...sp)
  const maxSn = Math.max(...sn)

  const nsp = maxSp === 0 ? sp.map(() => 0) : sp.map(s => s / maxSp)
  const nsn = maxSn === 0 ? sn.map(() => 1) : sn.map(s => 1 - s / maxSn)

  const scores = alternatives.map((alt, i) => ({
    alternativeId: alt.id,
    alternativeName: alt.name,
    score: (nsp[i] + nsn[i]) / 2,
    rank: 0
  }))

  scores.sort((a, b) => b.score - a.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

function psi(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[], weights: number[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const normalizedWeights = normalizeWeights(weights, nCriteria)
  
  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  matrix.forEach(m => {
    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })

  const minVal: number[] = []
  const maxVal: number[] = []
  for (let j = 0; j < nCriteria; j++) {
    minVal.push(Math.min(...matrix2d.map(row => row[j])))
    maxVal.push(Math.max(...matrix2d.map(row => row[j])))
  }

  const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      const range = maxVal[j] - minVal[j]
      if (range === 0) {
        normalized[i][j] = 0
      } else if (criteria[j].type === "benefit") {
        normalized[i][j] = (matrix2d[i][j] - minVal[j]) / range
      } else {
        normalized[i][j] = (maxVal[j] - matrix2d[i][j]) / range
      }
    }
  }

  const colSum: number[] = Array(nCriteria).fill(0)
  for (let j = 0; j < nCriteria; j++) {
    for (let i = 0; i < nAlternatives; i++) {
      colSum[j] += normalized[i][j]
    }
  }

  const relativePref: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      relativePref[i][j] = colSum[j] === 0 ? 0 : normalized[i][j] / colSum[j]
    }
  }

  const scores = alternatives.map((alt, i) => {
    let psi = 0
    for (let j = 0; j < nCriteria; j++) {
      psi += normalizedWeights[j] * relativePref[i][j]
    }
    return {
      alternativeId: alt.id,
      alternativeName: alt.name,
      score: psi,
      rank: 0
    }
  })

  scores.sort((a, b) => b.score - a.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

function moora(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[], weights: number[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const normalizedWeights = normalizeWeights(weights, nCriteria)
  
  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  matrix.forEach(m => {
    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })

  const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let j = 0; j < nCriteria; j++) {
    let sum = 0
    for (let i = 0; i < nAlternatives; i++) {
      sum += matrix2d[i][j] ** 2
    }
    const sqrt = Math.sqrt(sum)
    for (let i = 0; i < nAlternatives; i++) {
      normalized[i][j] = sqrt === 0 ? 0 : matrix2d[i][j] / sqrt
    }
  }

  const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      weighted[i][j] = normalized[i][j] * normalizedWeights[j]
    }
  }

  const scores = alternatives.map((alt, i) => {
    let sum = 0
    for (let j = 0; j < nCriteria; j++) {
      if (criteria[j].type === "benefit") {
        sum += weighted[i][j]
      } else {
        sum -= weighted[i][j]
      }
    }
    return {
      alternativeId: alt.id,
      alternativeName: alt.name,
      score: sum,
      rank: 0
    }
  })

  scores.sort((a, b) => b.score - a.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

function vikor(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[], weights: number[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const normalizedWeights = normalizeWeights(weights, nCriteria)
  
  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  matrix.forEach(m => {
    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })

  const fMax: number[] = []
  const fMin: number[] = []
  for (let j = 0; j < nCriteria; j++) {
    fMax.push(Math.max(...matrix2d.map(row => row[j])))
    fMin.push(Math.min(...matrix2d.map(row => row[j])))
  }

  const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      const range = fMax[j] - fMin[j]
      if (range === 0) {
        normalized[i][j] = 0
      } else if (criteria[j].type === "benefit") {
        normalized[i][j] = (fMax[j] - matrix2d[i][j]) / range
      } else {
        normalized[i][j] = (matrix2d[i][j] - fMin[j]) / range
      }
    }
  }

  const s: number[] = Array(nAlternatives).fill(0)
  const r: number[] = Array(nAlternatives).fill(0)
  
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      s[i] += normalizedWeights[j] * normalized[i][j]
      r[i] = Math.max(r[i], normalizedWeights[j] * normalized[i][j])
    }
  }

  const sMax = Math.max(...s)
  const sMin = Math.min(...s)
  const rMax = Math.max(...r)
  const rMin = Math.min(...r)

  const v = 0.5

  const scores = alternatives.map((alt, i) => {
    const q = v * (sMax === sMin ? 0 : (s[i] - sMin) / (sMax - sMin)) + 
               (1 - v) * (rMax === rMin ? 0 : (r[i] - rMin) / (rMax - rMin))
    return {
      alternativeId: alt.id,
      alternativeName: alt.name,
      score: q,
      rank: 0
    }
  })

  scores.sort((a, b) => a.score - b.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

function ahp(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[], weights: number[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const normalizedWeights = normalizeWeights(weights, nCriteria)
  
  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  matrix.forEach(m => {
    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })

  const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let j = 0; j < nCriteria; j++) {
    let sum = 0
    for (let i = 0; i < nAlternatives; i++) {
      sum += matrix2d[i][j]
    }
    for (let i = 0; i < nAlternatives; i++) {
      normalized[i][j] = sum === 0 ? 0 : matrix2d[i][j] / sum
    }
  }

  const scores = alternatives.map((alt, i) => {
    let score = 0
    for (let j = 0; j < nCriteria; j++) {
      score += normalized[i][j] * normalizedWeights[j]
    }
    return {
      alternativeId: alt.id,
      alternativeName: alt.name,
      score,
      rank: 0
    }
  })

  scores.sort((a, b) => b.score - a.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

function copras(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[], weights: number[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const normalizedWeights = normalizeWeights(weights, nCriteria)
  
  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  matrix.forEach(m => {
    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })

  const colSum: number[] = Array(nCriteria).fill(0)
  for (let j = 0; j < nCriteria; j++) {
    for (let i = 0; i < nAlternatives; i++) {
      colSum[j] += matrix2d[i][j]
    }
  }

  const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      normalized[i][j] = colSum[j] === 0 ? 0 : matrix2d[i][j] / colSum[j]
    }
  }

  const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      weighted[i][j] = normalized[i][j] * normalizedWeights[j]
    }
  }

  const sPlus: number[] = Array(nAlternatives).fill(0)
  const sMinus: number[] = Array(nAlternatives).fill(0)
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      if (criteria[j].type === "benefit") {
        sPlus[i] += weighted[i][j]
      } else {
        sMinus[i] += weighted[i][j]
      }
    }
  }

  const hasCost = criteria.some(c => c.type === "cost")
  const safeSMinus = sMinus.map(value => value <= 0 ? Number.EPSILON : value)
  const sumSMinus = safeSMinus.reduce((acc, value) => acc + value, 0)
  const sumInvSMinus = safeSMinus.reduce((acc, value) => acc + (1 / value), 0)

  const scores = alternatives.map((alt, i) => {
    const q = !hasCost || sumInvSMinus === 0
      ? sPlus[i]
      : sPlus[i] + (sumSMinus / (safeSMinus[i] * sumInvSMinus))
    return {
      alternativeId: alt.id,
      alternativeName: alt.name,
      score: q,
      rank: 0
    }
  })

  scores.sort((a, b) => b.score - a.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

function promethee(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[], weights: number[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const normalizedWeights = normalizeWeights(weights, nCriteria)
  
  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  matrix.forEach(m => {
    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })

  const minVal: number[] = []
  const maxVal: number[] = []
  for (let j = 0; j < nCriteria; j++) {
    minVal.push(Math.min(...matrix2d.map(row => row[j])))
    maxVal.push(Math.max(...matrix2d.map(row => row[j])))
  }

  const pref: number[][][] = Array(nAlternatives).fill(null).map(() => 
    Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  )
  
  for (let i = 0; i < nAlternatives; i++) {
    for (let k = 0; k < nAlternatives; k++) {
      if (i === k) continue
      for (let j = 0; j < nCriteria; j++) {
        const diff = matrix2d[i][j] - matrix2d[k][j]
        const range = maxVal[j] - minVal[j]
        if (range === 0) {
          pref[i][k][j] = 0
        } else if (diff > 0) {
          if (criteria[j].type === "benefit") {
            pref[i][k][j] = diff / range
          } else {
            pref[i][k][j] = 0
          }
        } else {
          if (criteria[j].type === "cost") {
            pref[i][k][j] = -diff / range
          } else {
            pref[i][k][j] = 0
          }
        }
      }
    }
  }

  const pi: number[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let k = 0; k < nAlternatives; k++) {
      if (i === k) continue
      for (let j = 0; j < nCriteria; j++) {
        pi[i][k] += normalizedWeights[j] * pref[i][k][j]
      }
    }
  }

  const phiPlus: number[] = Array(nAlternatives).fill(0)
  const phiMinus: number[] = Array(nAlternatives).fill(0)
  
  for (let i = 0; i < nAlternatives; i++) {
    for (let k = 0; k < nAlternatives; k++) {
      if (i !== k) {
        phiPlus[i] += pi[i][k]
        phiMinus[i] += pi[k][i]
      }
    }
    phiPlus[i] /= (nAlternatives - 1)
    phiMinus[i] /= (nAlternatives - 1)
  }

  const scores = alternatives.map((alt, i) => ({
    alternativeId: alt.id,
    alternativeName: alt.name,
    score: phiPlus[i] - phiMinus[i],
    rank: 0
  }))

  scores.sort((a, b) => b.score - a.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

function electre(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[], weights: number[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  const normalizedWeights = normalizeWeights(weights, nCriteria)
  
  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  matrix.forEach(m => {
    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
    if (altIdx !== -1 && critIdx !== -1) {
      matrix2d[altIdx][critIdx] = m.value
    }
  })

  const minVal: number[] = []
  const maxVal: number[] = []
  for (let j = 0; j < nCriteria; j++) {
    minVal.push(Math.min(...matrix2d.map(row => row[j])))
    maxVal.push(Math.max(...matrix2d.map(row => row[j])))
  }

  const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      const range = maxVal[j] - minVal[j]
      if (range === 0) {
        normalized[i][j] = 0
      } else if (criteria[j].type === "benefit") {
        normalized[i][j] = (matrix2d[i][j] - minVal[j]) / range
      } else {
        normalized[i][j] = (maxVal[j] - matrix2d[i][j]) / range
      }
    }
  }

  const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      weighted[i][j] = normalized[i][j] * normalizedWeights[j]
    }
  }

  const concordance: number[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(0))
  const discordance: number[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(0))

  for (let i = 0; i < nAlternatives; i++) {
    for (let k = 0; k < nAlternatives; k++) {
      if (i === k) continue

      let concordanceValue = 0
      let maxDiffAll = 0
      let maxDiffDisadvantage = 0

      for (let j = 0; j < nCriteria; j++) {
        const diff = Math.abs(weighted[i][j] - weighted[k][j])
        maxDiffAll = Math.max(maxDiffAll, diff)

        if (weighted[i][j] >= weighted[k][j]) {
          concordanceValue += normalizedWeights[j]
        } else {
          maxDiffDisadvantage = Math.max(maxDiffDisadvantage, diff)
        }
      }

      concordance[i][k] = concordanceValue
      discordance[i][k] = maxDiffAll === 0 ? 0 : maxDiffDisadvantage / maxDiffAll
    }
  }

  let pairCount = 0
  let concordanceTotal = 0
  let discordanceTotal = 0
  for (let i = 0; i < nAlternatives; i++) {
    for (let k = 0; k < nAlternatives; k++) {
      if (i !== k) {
        pairCount += 1
        concordanceTotal += concordance[i][k]
        discordanceTotal += discordance[i][k]
      }
    }
  }

  const thresholdConc = pairCount === 0 ? 0 : concordanceTotal / pairCount
  const thresholdDisc = pairCount === 0 ? 0 : discordanceTotal / pairCount

  const outrank: boolean[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(false))
  for (let i = 0; i < nAlternatives; i++) {
    for (let k = 0; k < nAlternatives; k++) {
      if (i !== k && concordance[i][k] >= thresholdConc && discordance[i][k] <= thresholdDisc) {
        outrank[i][k] = true
      }
    }
  }

  const scores = alternatives.map((alt, i) => {
    let score = 0
    for (let k = 0; k < nAlternatives; k++) {
      if (outrank[i][k]) score += 1
    }
    return {
      alternativeId: alt.id,
      alternativeName: alt.name,
      score,
      rank: 0
    }
  })

  scores.sort((a, b) => b.score - a.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

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
  const [weightMode, setWeightMode] = useState<WeightInputMode>("percentage")
  const [currentAlternative, setCurrentAlternative] = useState("")
  const [results, setResults] = useState<RankingResult[] | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [showFormulaPopup, setShowFormulaPopup] = useState(false)

  const addCriteria = () => {
    if (currentCriteria.trim()) {
      const nextCount = criteria.length + 1
      const normalizedCurrent = normalizeWeights(criteria.map((criterion) => criterion.weight), criteria.length)
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
        name: currentAlternative 
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
      const normalized = normalizeWeights(filteredCriteria.map((criterion) => criterion.weight), filteredCriteria.length)
      setCriteria(
        filteredCriteria.map((criterion, index) => ({
          ...criterion,
          weight: normalized[index],
        }))
      )
    }
    setMatrix(matrix.filter(m => m.criteriaId !== id))
  }

  const removeAlternative = (id: string) => {
    setAlternatives(alternatives.filter(a => a.id !== id))
    setMatrix(matrix.filter(m => m.alternativeId !== id))
  }

  const updateMatrixValue = (altId: string, critId: string, value: number) => {
    setMatrix(prev => {
      const existing = prev.find(m => m.alternativeId === altId && m.criteriaId === critId)
      if (existing) {
        return prev.map(m => 
          m.alternativeId === altId && m.criteriaId === critId 
            ? { ...m, value } 
            : m
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
          : criterion
      )
    )
  }

  const getDisplayWeight = (weight: number): number =>
    Number.parseFloat((weightMode === "percentage" ? weight * 100 : weight).toFixed(6))

  const rawWeights = criteria.map((criterion) => Math.max(0, criterion.weight))
  const normalizedWeights = normalizeWeights(rawWeights, criteria.length)
  const rawWeightTotal = rawWeights.reduce((acc, weight) => acc + weight, 0)
  const displayedWeightTotal = weightMode === "percentage" ? rawWeightTotal * 100 : rawWeightTotal
  const canCalculate = criteria.length >= 2 && alternatives.length >= 2 && rawWeightTotal > 0

  const runCalculation = () => {
    if (!canCalculate) {
      return
    }

    let results: RankingResult[] = []
    const calculationWeights = normalizeWeights(criteria.map((criterion) => criterion.weight), criteria.length)
    
    switch (method) {
      case "topsis":
        results = topsis(criteria, alternatives, matrix, calculationWeights)
        break
      case "edas":
        results = edas(criteria, alternatives, matrix, calculationWeights)
        break
      case "psi":
        results = psi(criteria, alternatives, matrix, calculationWeights)
        break
      case "moora":
        results = moora(criteria, alternatives, matrix, calculationWeights)
        break
      case "vikor":
        results = vikor(criteria, alternatives, matrix, calculationWeights)
        break
      case "ahp":
        results = ahp(criteria, alternatives, matrix, calculationWeights)
        break
      case "copras":
        results = copras(criteria, alternatives, matrix, calculationWeights)
        break
      case "promethee":
        results = promethee(criteria, alternatives, matrix, calculationWeights)
        break
      case "electre":
        results = electre(criteria, alternatives, matrix, calculationWeights)
        break
      default:
        results = topsis(criteria, alternatives, matrix, calculationWeights)
    }
    
    setResults(results)
    setShowResults(true)
  }

  const methodNames: Record<string, string> = {
    topsis: "TOPSIS",
    ahp: "AHP",
    edas: "EDAS",
    psi: "PSI",
    vikor: "VIKOR",
    moora: "MOORA",
    electre: "ELECTRE",
    promethee: "PROMETHEE",
    copras: "COPRAS"
  }

  const stepMatrix = showSteps && results
    ? buildMatrix2d(criteria, alternatives, matrix)
    : []

  const methodStepDetails = showSteps && results
    ? createMethodStepDetails(method, criteria, alternatives, matrix, normalizedWeights)
    : null

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/decision")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Pemilihan Metode
        </Button>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{decisionName}</h1>
            <p className="text-muted-foreground">Metode: {methodNames[method] || method}</p>
          </div>
        </div>

        {!showResults ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 mb-8">
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
                    <div className="flex-1 flex gap-2">
                      <Input 
                        placeholder="Nama kriteria..." 
                        value={currentCriteria}
                        onChange={(e) => setCurrentCriteria(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCriteria()}
                        className="flex-1"
                      />
                      <select 
                        value={currentCriteriaType}
                        onChange={(e) => setCurrentCriteriaType(e.target.value as "benefit" | "cost")}
                        className="border rounded-md px-3 py-2 bg-background"
                      >
                        <option value="benefit">Benefit</option>
                        <option value="cost">Cost</option>
                      </select>
                    </div>
                    <Button onClick={addCriteria} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm font-medium">Mode input bobot</span>
                    <select
                      value={weightMode}
                      onChange={(e) => setWeightMode(e.target.value as WeightInputMode)}
                      className="border rounded-md px-3 py-2 bg-background text-sm"
                    >
                      <option value="percentage">Persentase (%)</option>
                      <option value="decimal">Desimal (0-1)</option>
                    </select>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Total bobot input: {formatNumber(displayedWeightTotal, 4)}{weightMode === "percentage" ? "%" : ""}
                  </p>

                  <div className="space-y-2">
                    {criteria.map((c, index) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">{c.name}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${c.type === "benefit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {c.type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Bobot normalisasi (dipakai hitung): {formatNumber(normalizedWeights[index] ?? 0, 4)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={getDisplayWeight(c.weight)}
                            onChange={(e) => updateCriteriaWeight(c.id, e.target.value)}
                            className="h-8 w-28 text-right"
                          />
                          <span className="w-5 text-center text-xs text-muted-foreground">
                            {weightMode === "percentage" ? "%" : ""}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => removeCriteria(c.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {criteria.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
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
                      onChange={(e) => setCurrentAlternative(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addAlternative()}
                      className="flex-1"
                    />
                    <Button onClick={addAlternative} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {alternatives.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="font-medium">{a.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeAlternative(a.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    {alternatives.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
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
                    Masukkan nilai untuk setiap alternatif pada setiap kriteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="p-2 text-left">Alternatif</th>
                          {criteria.map(c => (
                            <th key={c.id} className="p-2 text-center">
                              {c.name}
                              <span className={`ml-1 text-xs ${c.type === "benefit" ? "text-green-600" : "text-red-600"}`}>
                                ({c.type})
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {alternatives.map(alt => (
                          <tr key={alt.id}>
                            <td className="p-2 font-medium">{alt.name}</td>
                            {criteria.map(crit => {
                              const val = matrix.find(m => m.alternativeId === alt.id && m.criteriaId === crit.id)?.value
                              return (
                                <td key={crit.id} className="p-2">
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    value={val ?? ""}
                                    onChange={(e) => updateMatrixValue(alt.id, crit.id, parseFloat(e.target.value) || 0)}
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
                onClick={runCalculation}
              >
                <Play className="h-4 w-4" />
                Hitung Ranking
              </Button>
            </div>

            {criteria.length >= 2 && alternatives.length >= 2 && rawWeightTotal <= 0 && (
              <p className="mt-3 text-center text-sm text-red-600">
                Total bobot harus lebih dari 0.
              </p>
            )}
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Hasil Ranking - {methodNames[method]}</CardTitle>
              <CardDescription>
                Ranking alternatif berdasarkan perhitungan {methodNames[method]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results?.map((result) => (
                  <div 
                    key={result.alternativeId} 
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      result.rank === 1 ? "border-yellow-400 bg-yellow-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                        result.rank === 1 ? "bg-yellow-400 text-white" : 
                        result.rank === 2 ? "bg-gray-300 text-gray-700" :
                        result.rank === 3 ? "bg-amber-600 text-white" : "bg-muted"
                      }`}>
                        {result.rank}
                      </div>
                      <div>
                        <p className="font-medium">{result.alternativeName}</p>
                        <p className="text-sm text-muted-foreground">
                          Skor: {result.score.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    {result.rank === 1 && (
                      <span className="text-yellow-600 font-medium">Pemenang</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-4 flex-wrap">
                <Button variant="outline" onClick={() => {
                  setShowResults(false)
                  setShowFormulaPopup(false)
                }}>
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
                  {showSteps ? "Sembunyikan Langkah" : "Lihat Langkah Perhitungan"}
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
                        <span>Langkah-langkah Perhitungan {methodNames[method]}</span>
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
                        <h4 className="font-semibold mb-2">Langkah 1 : Menentukan alternatif</h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm">
                          {alternatives.map((alt) => (
                            <li key={alt.id}>{alt.name}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Langkah 2 : Menentukan kriteria</h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm">
                          {criteria.map((crit) => (
                            <li key={crit.id}>
                              {crit.name} ({crit.type})
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Langkah 3 : Menentukan nilai setiap kriteria untuk setiap alternatif</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr>
                                <th className="border p-2 text-left">Alternatif</th>
                                {criteria.map((c) => (
                                  <th key={c.id} className="border p-2 text-center">{c.name}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {alternatives.map((alt, i) => (
                                <tr key={alt.id}>
                                  <td className="border p-2 font-medium">{alt.name}</td>
                                  {criteria.map((crit, j) => (
                                    <td key={crit.id} className="border p-2 text-center">{formatNumber(stepMatrix[i][j] ?? 0, 4)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold mb-2">Langkah 4 : {methodStepDetails.step4Title}</h4>
                        <p className="text-sm text-muted-foreground">Rumus tersedia di tombol "!".</p>
                        {methodStepDetails.step4Notes?.map((note, index) => (
                          <p key={`${note}-${index}`} className="text-sm text-muted-foreground">{note}</p>
                        ))}
                        {methodStepDetails.step4Tables.map((table, tableIndex) => (
                          <div key={`${table.title}-${tableIndex}`} className="space-y-2">
                            <p className="text-sm font-medium">{table.title}</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr>
                                    <th className="border p-2 text-left">{table.rowHeader ?? "Alternatif"}</th>
                                    {table.headers.map((header) => (
                                      <th key={`${table.title}-${header}`} className="border p-2 text-center">{header}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {table.rows.map((row, rowIndex) => (
                                    <tr key={`${table.title}-${row.label}-${rowIndex}`}>
                                      <td className="border p-2 font-medium">{row.label}</td>
                                      {row.values.map((value, valueIndex) => (
                                        <td key={`${table.title}-${row.label}-${valueIndex}`} className="border p-2 text-center">
                                          {formatNumber(value, table.digits ?? 4)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Langkah 5 : Menentukan bobot setiap kriteria</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Bobot input akan dinormalisasi agar total bobot = 1 sebelum perhitungan.
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr>
                                <th className="border p-2 text-left">Kriteria</th>
                                <th className="border p-2 text-center">Bobot input</th>
                                <th className="border p-2 text-center">Bobot normalisasi (w_j)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {criteria.map((crit, index) => (
                                <tr key={crit.id}>
                                  <td className="border p-2">{crit.name}</td>
                                  <td className="border p-2 text-center">
                                    {formatNumber(getDisplayWeight(crit.weight), 4)}{weightMode === "percentage" ? "%" : ""}
                                  </td>
                                  <td className="border p-2 text-center">{formatNumber(normalizedWeights[index] ?? 0, 4)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold mb-2">Langkah 6 : {methodStepDetails.step6Title}</h4>
                        <p className="text-sm text-muted-foreground">Rumus tersedia di tombol "!".</p>
                        {methodStepDetails.step6Notes?.map((note, index) => (
                          <p key={`${note}-${index}`} className="text-sm text-muted-foreground">{note}</p>
                        ))}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{methodStepDetails.step6Table.title}</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr>
                                  <th className="border p-2 text-left">{methodStepDetails.step6Table.rowHeader ?? "Alternatif"}</th>
                                  {methodStepDetails.step6Table.headers.map((header) => (
                                    <th key={`step6-${header}`} className="border p-2 text-center">{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {methodStepDetails.step6Table.rows.map((row, rowIndex) => (
                                  <tr key={`step6-${row.label}-${rowIndex}`}>
                                    <td className="border p-2 font-medium">{row.label}</td>
                                    {row.values.map((value, valueIndex) => (
                                      <td key={`step6-${row.label}-${valueIndex}`} className="border p-2 text-center">
                                        {formatNumber(value, methodStepDetails.step6Table.digits ?? 4)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Langkah 7 : Hasil</h4>
                        <table className="w-full text-sm border-collapse">
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
                                <td className="border p-2 text-center font-bold">{r.rank}</td>
                                <td className="border p-2">{r.alternativeName}</td>
                                <td className="border p-2 text-center">{formatNumber(r.score, 6)}</td>
                              </tr>
                            ))}
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
                            Rumus & Hasil Perhitungan {methodNames[method]}
                          </h3>
                          <Button variant="outline" onClick={() => setShowFormulaPopup(false)}>
                            Tutup
                          </Button>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <h4 className="font-semibold">Langkah 1 : Menentukan alternatif</h4>
                            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                              <code>A = {'{A_1, A_2, ..., A_m}'}</code>
                            </pre>
                            <p className="text-sm text-muted-foreground">
                              m = {alternatives.length} alternatif: {alternatives.map((alt) => alt.name).join(", ")}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold">Langkah 2 : Menentukan kriteria</h4>
                            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                              <code>C = {'{C_1, C_2, ..., C_n}'}</code>
                            </pre>
                            <p className="text-sm text-muted-foreground">
                              n = {criteria.length} kriteria: {criteria.map((crit) => `${crit.name} (${crit.type})`).join(", ")}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold">Langkah 3 : Menentukan nilai setiap kriteria untuk setiap alternatif</h4>
                            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                              <code>X = [x_ij], i = 1..m, j = 1..n</code>
                            </pre>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr>
                                    <th className="border p-2 text-left">Alternatif</th>
                                    {criteria.map((c) => (
                                      <th key={`popup-step3-${c.id}`} className="border p-2 text-center">{c.name}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {alternatives.map((alt, i) => (
                                    <tr key={`popup-step3-${alt.id}`}>
                                      <td className="border p-2 font-medium">{alt.name}</td>
                                      {criteria.map((crit, j) => (
                                        <td key={`popup-step3-${alt.id}-${crit.id}`} className="border p-2 text-center">
                                          {formatNumber(stepMatrix[i][j] ?? 0, 4)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold">Langkah 4 : {methodStepDetails.step4Title}</h4>
                            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                              <code>{methodStepDetails.step4Formula.join("\n")}</code>
                            </pre>
                            {methodStepDetails.step4Notes?.map((note, index) => (
                              <p key={`popup-step4-note-${index}`} className="text-sm text-muted-foreground">{note}</p>
                            ))}
                            {methodStepDetails.step4Tables.map((table, tableIndex) => (
                              <div key={`popup-step4-table-${tableIndex}`} className="space-y-2">
                                <p className="text-sm font-medium">{table.title}</p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm border-collapse">
                                    <thead>
                                      <tr>
                                        <th className="border p-2 text-left">{table.rowHeader ?? "Alternatif"}</th>
                                        {table.headers.map((header) => (
                                          <th key={`popup-step4-${tableIndex}-${header}`} className="border p-2 text-center">{header}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {table.rows.map((row, rowIndex) => (
                                        <tr key={`popup-step4-${tableIndex}-${rowIndex}`}>
                                          <td className="border p-2 font-medium">{row.label}</td>
                                          {row.values.map((value, valueIndex) => (
                                            <td key={`popup-step4-${tableIndex}-${rowIndex}-${valueIndex}`} className="border p-2 text-center">
                                              {formatNumber(value, table.digits ?? 4)}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold">Langkah 5 : Menentukan bobot setiap kriteria</h4>
                            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                              <code>w_j' = w_j / sum_j w_j</code>
                            </pre>
                            <p className="text-sm text-muted-foreground">
                              Total bobot input: {formatNumber(displayedWeightTotal, 4)}{weightMode === "percentage" ? "%" : ""}
                            </p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr>
                                    <th className="border p-2 text-left">Kriteria</th>
                                    <th className="border p-2 text-center">Bobot input</th>
                                    <th className="border p-2 text-center">Bobot normalisasi (w_j)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {criteria.map((crit, index) => (
                                    <tr key={`popup-step5-${crit.id}`}>
                                      <td className="border p-2">{crit.name}</td>
                                      <td className="border p-2 text-center">
                                        {formatNumber(getDisplayWeight(crit.weight), 4)}{weightMode === "percentage" ? "%" : ""}
                                      </td>
                                      <td className="border p-2 text-center">{formatNumber(normalizedWeights[index] ?? 0, 4)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold">Langkah 6 : {methodStepDetails.step6Title}</h4>
                            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                              <code>{methodStepDetails.step6Formula.join("\n")}</code>
                            </pre>
                            {methodStepDetails.step6Notes?.map((note, index) => (
                              <p key={`popup-step6-note-${index}`} className="text-sm text-muted-foreground">{note}</p>
                            ))}
                            <div className="space-y-2">
                              <p className="text-sm font-medium">{methodStepDetails.step6Table.title}</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                  <thead>
                                    <tr>
                                      <th className="border p-2 text-left">{methodStepDetails.step6Table.rowHeader ?? "Alternatif"}</th>
                                      {methodStepDetails.step6Table.headers.map((header) => (
                                        <th key={`popup-step6-${header}`} className="border p-2 text-center">{header}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {methodStepDetails.step6Table.rows.map((row, rowIndex) => (
                                      <tr key={`popup-step6-row-${rowIndex}`}>
                                        <td className="border p-2 font-medium">{row.label}</td>
                                        {row.values.map((value, valueIndex) => (
                                          <td key={`popup-step6-${rowIndex}-${valueIndex}`} className="border p-2 text-center">
                                            {formatNumber(value, methodStepDetails.step6Table.digits ?? 4)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold">Langkah 7 : Hasil</h4>
                            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                              <code>{method === "vikor" ? "Urutkan Q_i dari terkecil ke terbesar" : "Urutkan skor dari terbesar ke terkecil"}</code>
                            </pre>
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr>
                                  <th className="border p-2 text-center">Rank</th>
                                  <th className="border p-2 text-left">Alternatif</th>
                                  <th className="border p-2 text-center">Skor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.map((r) => (
                                  <tr key={`popup-step7-${r.alternativeId}`}>
                                    <td className="border p-2 text-center font-bold">{r.rank}</td>
                                    <td className="border p-2">{r.alternativeName}</td>
                                    <td className="border p-2 text-center">{formatNumber(r.score, 6)}</td>
                                  </tr>
                                ))}
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

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
}

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

function topsis(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  
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

  const weights = criteria.map(() => 1 / nCriteria)
  const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      weighted[i][j] = normalized[i][j] * weights[j]
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

function edas(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  
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

  const weights = criteria.map(() => 1 / nCriteria)

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
      sp[i] += weights[j] * Math.max(0, pda[i][j])
      sn[i] += weights[j] * Math.max(0, nda[i][j])
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

function psi(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  
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

  const weights = criteria.map(() => 1 / nCriteria)

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
      psi += weights[j] * relativePref[i][j]
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

function moora(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  
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

  const weights = criteria.map(() => 1 / nCriteria)
  const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      weighted[i][j] = normalized[i][j] * weights[j]
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

function vikor(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  
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

  const weights = criteria.map(() => 1 / nCriteria)

  const s: number[] = Array(nAlternatives).fill(0)
  const r: number[] = Array(nAlternatives).fill(0)
  
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      s[i] += weights[j] * normalized[i][j]
      r[i] = Math.max(r[i], weights[j] * normalized[i][j])
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

function ahp(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  
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

  const weights = criteria.map(() => 1 / nCriteria)

  const scores = alternatives.map((alt, i) => {
    let score = 0
    for (let j = 0; j < nCriteria; j++) {
      score += normalized[i][j] * weights[j]
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

function copras(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  
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

  const weights = criteria.map(() => 1 / nCriteria)
  const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
  for (let i = 0; i < nAlternatives; i++) {
    for (let j = 0; j < nCriteria; j++) {
      weighted[i][j] = normalized[i][j] * weights[j]
    }
  }

  const scores = alternatives.map((alt, i) => {
    let sumPlus = 0
    let sumMinus = 0
    for (let j = 0; j < nCriteria; j++) {
      if (criteria[j].type === "benefit") {
        sumPlus += weighted[i][j]
      } else {
        sumMinus += weighted[i][j]
      }
    }
    const totalMinus = sumMinus === 0 ? 1 : sumMinus
    const utility = sumPlus + (1 - totalMinus)
    return {
      alternativeId: alt.id,
      alternativeName: alt.name,
      score: utility,
      rank: 0
    }
  })

  scores.sort((a, b) => b.score - a.score)
  scores.forEach((s, i) => s.rank = i + 1)

  return scores
}

function promethee(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  
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

  const weights = criteria.map(() => 1 / nCriteria)

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
        pi[i][k] += weights[j] * pref[i][k][j]
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

function electre(criteria: Criteria[], alternatives: Alternative[], matrix: MatrixValue[]): RankingResult[] {
  const nCriteria = criteria.length
  const nAlternatives = alternatives.length
  
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

  const weights = criteria.map(() => 1 / nCriteria)

  const concordance: number[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(0))
  const discordance: number[][] = Array(nAlternatives).fill(null).map(() => Array(nAlternatives).fill(0))
  
  for (let i = 0; i < nAlternatives; i++) {
    for (let k = 0; k < nAlternatives; k++) {
      if (i === k) continue
      
      let concSum = 0
      for (let j = 0; j < nCriteria; j++) {
        if (normalized[i][j] >= normalized[k][j]) {
          concSum += weights[j]
        }
      }
      concordance[i][k] = concSum

      let maxDiff = 0
      let maxDenom = 0
      for (let j = 0; j < nCriteria; j++) {
        const diff = Math.abs(normalized[i][j] - normalized[k][j])
        maxDiff = Math.max(maxDiff, diff)
        const denomRange = maxVal[j] - minVal[j]
        maxDenom = Math.max(maxDenom, denomRange === 0 ? 0 : diff / denomRange)
      }
      discordance[i][k] = maxDenom === 0 ? 0 : maxDiff / maxDenom
    }
  }

  const thresholdConc = 0.5
  const thresholdDisc = 0.5

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
  const [currentAlternative, setCurrentAlternative] = useState("")
  const [results, setResults] = useState<RankingResult[] | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showSteps, setShowSteps] = useState(false)

  const addCriteria = () => {
    if (currentCriteria.trim()) {
      const newCriteria: Criteria = { 
        id: crypto.randomUUID(), 
        name: currentCriteria, 
        type: currentCriteriaType 
      }
      setCriteria([...criteria, newCriteria])
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
    setCriteria(criteria.filter(c => c.id !== id))
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

  const runCalculation = () => {
    let results: RankingResult[] = []
    
    switch (method) {
      case "topsis":
        results = topsis(criteria, alternatives, matrix)
        break
      case "edas":
        results = edas(criteria, alternatives, matrix)
        break
      case "psi":
        results = psi(criteria, alternatives, matrix)
        break
      case "moora":
        results = moora(criteria, alternatives, matrix)
        break
      case "vikor":
        results = vikor(criteria, alternatives, matrix)
        break
      case "ahp":
        results = ahp(criteria, alternatives, matrix)
        break
      case "copras":
        results = copras(criteria, alternatives, matrix)
        break
      case "promethee":
        results = promethee(criteria, alternatives, matrix)
        break
      case "electre":
        results = electre(criteria, alternatives, matrix)
        break
      default:
        results = topsis(criteria, alternatives, matrix)
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
                  <div className="space-y-2">
                    {criteria.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <span className="font-medium">{c.name}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded ${c.type === "benefit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {c.type}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeCriteria(c.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
                disabled={criteria.length < 2 || alternatives.length < 2}
                onClick={runCalculation}
              >
                <Play className="h-4 w-4" />
                Hitung Ranking
              </Button>
            </div>
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
                <Button variant="outline" onClick={() => setShowResults(false)}>
                  Ubah Input
                </Button>
                <Button variant="outline" onClick={() => setShowSteps(!showSteps)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  {showSteps ? "Sembunyikan Langkah" : "Lihat Langkah Perhitungan"}
                </Button>
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Simpan Hasil
                </Button>
              </div>

              {showSteps && results && (
                <div className="mt-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Langkah-langkah Perhitungan {methodNames[method]}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2">1. Matriks Keputusan Awal</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr>
                                <th className="border p-2 text-left">Alternatif</th>
                                {criteria.map(c => (
                                  <th key={c.id} className="border p-2 text-center">{c.name}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {alternatives.map(alt => (
                                <tr key={alt.id}>
                                  <td className="border p-2 font-medium">{alt.name}</td>
                                  {criteria.map(crit => {
                                    const val = matrix.find(m => m.alternativeId === alt.id && m.criteriaId === crit.id)?.value ?? 0
                                    return (
                                      <td key={crit.id} className="border p-2 text-center">{val}</td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">2. Normalisasi Matriks (Euclidean)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr>
                                <th className="border p-2 text-left">Alternatif</th>
                                {criteria.map(c => (
                                  <th key={c.id} className="border p-2 text-center">{c.name}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const nCriteria = criteria.length
                                const nAlternatives = alternatives.length
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
                                return alternatives.map((alt, i) => (
                                  <tr key={alt.id}>
                                    <td className="border p-2 font-medium">{alt.name}</td>
                                    {criteria.map((_, j) => (
                                      <td key={j} className="border p-2 text-center">{normalized[i][j].toFixed(4)}</td>
                                    ))}
                                  </tr>
                                ))
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">3. Matriks Terboboti</h4>
                        <p className="text-sm text-muted-foreground mb-2">Bobot sama untuk semua kriteria: {criteria.map(() => (1/criteria.length).toFixed(4)).join(", ")}</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr>
                                <th className="border p-2 text-left">Alternatif</th>
                                {criteria.map(c => (
                                  <th key={c.id} className="border p-2 text-center">{c.name}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const nCriteria = criteria.length
                                const nAlternatives = alternatives.length
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
                                const weights = criteria.map(() => 1 / nCriteria)
                                const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                for (let i = 0; i < nAlternatives; i++) {
                                  for (let j = 0; j < nCriteria; j++) {
                                    weighted[i][j] = normalized[i][j] * weights[j]
                                  }
                                }
                                return alternatives.map((alt, i) => (
                                  <tr key={alt.id}>
                                    <td className="border p-2 font-medium">{alt.name}</td>
                                    {criteria.map((_, j) => (
                                      <td key={j} className="border p-2 text-center">{weighted[i][j].toFixed(4)}</td>
                                    ))}
                                  </tr>
                                ))
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {method === "topsis" && (
                        <>
                          <div>
                            <h4 className="font-semibold mb-2">4. Solusi Ideal Positif (A⁺) dan Negatif (A⁻)</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium mb-1">A⁺ (Benefit: max, Cost: min)</p>
                                <div className="bg-muted p-2 rounded text-sm">
                                  {(() => {
                                    const nCriteria = criteria.length
                                    const nAlternatives = alternatives.length
                                    const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                    matrix.forEach(m => {
                                      const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
                                      const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
                                      if (altIdx !== -1 && critIdx !== -1) matrix2d[altIdx][critIdx] = m.value
                                    })
                                    const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                    for (let j = 0; j < nCriteria; j++) { let sum = 0; for (let i = 0; i < nAlternatives; i++) sum += matrix2d[i][j] ** 2; const sqrt = Math.sqrt(sum); for (let i = 0; i < nAlternatives; i++) normalized[i][j] = sqrt === 0 ? 0 : matrix2d[i][j] / sqrt }
                                    const weights = criteria.map(() => 1 / nCriteria)
                                    const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                    for (let i = 0; i < nAlternatives; i++) for (let j = 0; j < nCriteria; j++) weighted[i][j] = normalized[i][j] * weights[j]
                                    return criteria.map((c, j) => {
                                      const val = c.type === "benefit" ? Math.max(...weighted.map(r => r[j])) : Math.min(...weighted.map(r => r[j]))
                                      return `${c.name}: ${val.toFixed(4)}`
                                    }).join(", ")
                                  })()}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium mb-1">A⁻ (Benefit: min, Cost: max)</p>
                                <div className="bg-muted p-2 rounded text-sm">
                                  {(() => {
                                    const nCriteria = criteria.length
                                    const nAlternatives = alternatives.length
                                    const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                    matrix.forEach(m => {
                                      const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
                                      const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
                                      if (altIdx !== -1 && critIdx !== -1) matrix2d[altIdx][critIdx] = m.value
                                    })
                                    const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                    for (let j = 0; j < nCriteria; j++) { let sum = 0; for (let i = 0; i < nAlternatives; i++) sum += matrix2d[i][j] ** 2; const sqrt = Math.sqrt(sum); for (let i = 0; i < nAlternatives; i++) normalized[i][j] = sqrt === 0 ? 0 : matrix2d[i][j] / sqrt }
                                    const weights = criteria.map(() => 1 / nCriteria)
                                    const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                    for (let i = 0; i < nAlternatives; i++) for (let j = 0; j < nCriteria; j++) weighted[i][j] = normalized[i][j] * weights[j]
                                    return criteria.map((c, j) => {
                                      const val = c.type === "benefit" ? Math.min(...weighted.map(r => r[j])) : Math.max(...weighted.map(r => r[j]))
                                      return `${c.name}: ${val.toFixed(4)}`
                                    }).join(", ")
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">5. Jarak ke Solusi Ideal</h4>
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr>
                                  <th className="border p-2 text-left">Alternatif</th>
                                  <th className="border p-2 text-center">D⁺</th>
                                  <th className="border p-2 text-center">D⁻</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const nCriteria = criteria.length
                                  const nAlternatives = alternatives.length
                                  const matrix2d: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                  matrix.forEach(m => {
                                    const altIdx = alternatives.findIndex(a => a.id === m.alternativeId)
                                    const critIdx = criteria.findIndex(c => c.id === m.criteriaId)
                                    if (altIdx !== -1 && critIdx !== -1) matrix2d[altIdx][critIdx] = m.value
                                  })
                                  const normalized: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                  for (let j = 0; j < nCriteria; j++) { let sum = 0; for (let i = 0; i < nAlternatives; i++) sum += matrix2d[i][j] ** 2; const sqrt = Math.sqrt(sum); for (let i = 0; i < nAlternatives; i++) normalized[i][j] = sqrt === 0 ? 0 : matrix2d[i][j] / sqrt }
                                  const weights = criteria.map(() => 1 / nCriteria)
                                  const weighted: number[][] = Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0))
                                  for (let i = 0; i < nAlternatives; i++) for (let j = 0; j < nCriteria; j++) weighted[i][j] = normalized[i][j] * weights[j]
                                  const idealPositive: number[] = [], idealNegative: number[] = []
                                  for (let j = 0; j < nCriteria; j++) {
                                    if (criteria[j].type === "benefit") { idealPositive[j] = Math.max(...weighted.map(r => r[j])); idealNegative[j] = Math.min(...weighted.map(r => r[j])) }
                                    else { idealPositive[j] = Math.min(...weighted.map(r => r[j])); idealNegative[j] = Math.max(...weighted.map(r => r[j])) }
                                  }
                                  const distances: { plus: number[]; minus: number[] } = { plus: [], minus: [] }
                                  for (let i = 0; i < nAlternatives; i++) {
                                    let sumPlus = 0, sumMinus = 0
                                    for (let j = 0; j < nCriteria; j++) { sumPlus += (weighted[i][j] - idealPositive[j]) ** 2; sumMinus += (weighted[i][j] - idealNegative[j]) ** 2 }
                                    distances.plus.push(Math.sqrt(sumPlus)); distances.minus.push(Math.sqrt(sumMinus))
                                  }
                                  return alternatives.map((alt, i) => (
                                    <tr key={alt.id}>
                                      <td className="border p-2 font-medium">{alt.name}</td>
                                      <td className="border p-2 text-center">{distances.plus[i].toFixed(4)}</td>
                                      <td className="border p-2 text-center">{distances.minus[i].toFixed(4)}</td>
                                    </tr>
                                  ))
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2">{method === "topsis" ? "6" : "4"}. Hasil Skor dan Ranking</h4>
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr>
                              <th className="border p-2 text-center">Rank</th>
                              <th className="border p-2 text-left">Alternatif</th>
                              <th className="border p-2 text-center">Skor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.map(r => (
                              <tr key={r.alternativeId}>
                                <td className="border p-2 text-center font-bold">{r.rank}</td>
                                <td className="border p-2">{r.alternativeName}</td>
                                <td className="border p-2 text-center">{r.score.toFixed(6)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
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

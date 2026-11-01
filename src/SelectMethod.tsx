import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreateDecision } from "@/features/decision/hooks/use-decisions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Activity,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Blend,
  Calculator,
  CheckCircle2,
  Divide,
  Filter,
  Gauge,
  Layers,
  Network,
  Percent,
  Plus,
  Scale,
  Sigma,
  SlidersHorizontal,
  Target,
  Waves,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface MethodOption {
  id: string
  name: string
  fullName: string
  icon: LucideIcon
}

const methods: MethodOption[] = [
  {
    id: "topsis",
    name: "TOPSIS",
    fullName: "Technique for Order Preference by Similarity to Ideal Solution",
    icon: Target,
  },
  {
    id: "ahp",
    name: "AHP",
    fullName: "Analytic Hierarchy Process",
    icon: Network,
  },
  {
    id: "edas",
    name: "EDAS",
    fullName: "Evaluation based on Distance from Average Solution",
    icon: Sigma,
  },
  {
    id: "psi",
    name: "PSI",
    fullName: "Preference Selection Index",
    icon: Activity,
  },
  {
    id: "vikor",
    name: "VIKOR",
    fullName: "VIseKriterijumska Optimizacija I Kompromisno Resenje",
    icon: Scale,
  },
  {
    id: "moora",
    name: "MOORA",
    fullName: "Multi-Objective Optimization on the basis of Ratio Analysis",
    icon: Divide,
  },
  {
    id: "electre",
    name: "ELECTRE",
    fullName: "ELimination and Choice Expressing REality",
    icon: Filter,
  },
  {
    id: "promethee",
    name: "PROMETHEE",
    fullName: "Preference Ranking Organization METHod for Enrichment of Evaluations",
    icon: ArrowLeftRight,
  },
  {
    id: "copras",
    name: "COPRAS",
    fullName: "COmplex PRoportional ASsessment",
    icon: Percent,
  },
  {
    id: "saw",
    name: "SAW",
    fullName: "Simple Additive Weighting",
    icon: Plus,
  },
  {
    id: "wp",
    name: "WP",
    fullName: "Weighted Product Model",
    icon: Layers,
  },
  {
    id: "waspas",
    name: "WASPAS",
    fullName: "Weighted Aggregated Sum Product ASsessment",
    icon: Blend,
  },
  {
    id: "aras",
    name: "ARAS",
    fullName: "Additive Ratio ASsessment",
    icon: Gauge,
  },
  {
    id: "gra",
    name: "GRA",
    fullName: "Grey Relational Analysis",
    icon: Waves,
  },
  {
    id: "entropy",
    name: "Entropy",
    fullName: "Entropy Weight Method — penentu bobot otomatis dari data (bukan metode ranking)",
    icon: SlidersHorizontal,
  },
]

function SelectMethod() {
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [decisionName, setDecisionName] = useState("")
  const createDecision = useCreateDecision()

  const handleContinue = async () => {
    if (selectedMethod && decisionName && !createDecision.isPending) {
      try {
        const decision = await createDecision.mutateAsync({
          name: decisionName,
        })
        // Entropy bukan metode ranking: buka halaman matriks dengan metode
        // ranking default (TOPSIS) dan mode bobot otomatis Entropy.
        const methodParam =
          selectedMethod === "entropy" ? "topsis&weights=entropy" : selectedMethod
        navigate(`/decision/matrix?method=${methodParam}&name=${encodeURIComponent(decisionName)}&decisionId=${decision.id}`)
      } catch (error) {
        console.error("Failed to create decision:", error)
      }
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Home
        </Button>

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">
              Buat Keputusan Baru
            </h1>
            <p className="text-muted-foreground">
              Pilih metode DSS yang ingin Anda gunakan
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Nama Keputusan
              </CardTitle>
              <CardDescription>
                Beri nama untuk masalah keputusan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                id="decision-name-input"
                placeholder="Contoh: Pemilihan Supplier Bahan Baku"
                value={decisionName}
                onChange={(e) => setDecisionName(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Pilih Metode DSS
            </h2>
            <div id="method-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {methods.map((method) => (
                <Card
                  key={method.id}
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${
                    selectedMethod === method.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <method.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="flex-1">
                      <CardTitle className="text-base">{method.name}</CardTitle>
                    </div>
                    {selectedMethod === method.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{method.fullName}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              id="continue-button"
              size="lg"
              className="gap-2"
              disabled={!selectedMethod || !decisionName || createDecision.isPending}
              onClick={handleContinue}
            >
              {createDecision.isPending ? "Membuat..." : "Lanjutkan"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default SelectMethod

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { 
  Scale, 
  TrendingUp, 
  ListChecks, 
  GitBranch,
  BarChart3,
  Target,
  ArrowRight,
  Calculator
} from "lucide-react"

function Home() {
  const navigate = useNavigate()
  const features = [
    {
      icon: <Scale className="h-6 w-6" />,
      title: "Multi-Criteria Decision Making",
      description: "Kelola berbagai kriteria keputusan secara terstruktur dengan bobot yang bisa disesuaikan.",
    },
    {
      icon: <ListChecks className="h-6 w-6" />,
      title: "Decision Matrix",
      description: "Buat dan olah matriks keputusan dengan mudah untuk berbagai skenario.",
    },
    {
      icon: <Calculator className="h-6 w-6" />,
      title: "DSS Algorithms",
      description: "Pilih dari berbagai metode: TOPSIS, AHP, EDAS, PSI, VIKOR, MOORA, ELECTRE, PROMETHEE, COPRAS.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Ranking Results",
      description: "Dapatkan ranking alternatif secara otomatis berdasarkan perhitungan matematika.",
    },
  ]

  const methods = [
    { name: "TOPSIS", desc: "Technique for Order Preference by Similarity" },
    { name: "AHP", desc: "Analytic Hierarchy Process" },
    { name: "EDAS", desc: "Evaluation based on Distance from Average Solution" },
    { name: "PSI", desc: "Preference Selection Index" },
    { name: "VIKOR", desc: "VIseKriterijumska Optimizacija I Kompromisno Resenje" },
    { name: "MOORA", desc: "Multi-Objective Optimization on the basis of Ratio Analysis" },
    { name: "ELECTRE", desc: "ELimination and Choice Expressing REality" },
    { name: "PROMETHEE", desc: "Preference Ranking Organization METHod for Enrichment of Evaluations" },
    { name: "COPRAS", desc: "COmplex PRoportional ASsessment" },
  ]

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Target className="mr-2 h-4 w-4" />
              Decision Support System
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Decimatex
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Platform Sistem Pendukung Keputusan (SPK) yang mengotomatiskan analisis 
              keputusan menggunakan metode MCDM (Multi-Criteria Decision Making).
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2" onClick={() => navigate("/decision")}>
                Mulai Sekarang <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/learn")}>
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Fitur Utama
            </h2>
            <p className="mt-4 text-muted-foreground">
              Decimatex menyediakan berbagai fitur untuk membantu Anda membuat keputusan yang lebih baik.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={index} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Metode DSS yang Didukung
              </h2>
              <p className="mt-4 text-muted-foreground">
                Decimatex mendukung berbagai algoritma MCDM untuk berbagai kebutuhan.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {methods.map((method, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <CardTitle className="text-base">{method.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">{method.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <GitBranch className="mx-auto mb-6 h-12 w-12 text-primary" />
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Cara Kerja
          </h2>
          <p className="mb-8 text-muted-foreground">
            Ikuti alur sederhana untuk mendapatkan keputusan terbaik.
          </p>
          <div className="flex flex-col items-center gap-4 text-left">
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Definisikan Masalah Keputusan</h3>
                <p className="text-sm text-muted-foreground">Buat skenario keputusan Anda</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Tambah Kriteria & Alternatif</h3>
                <p className="text-sm text-muted-foreground">Definisikan faktor evaluasi dan opsi</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Isi Matriks Keputusan</h3>
                <p className="text-sm text-muted-foreground">Masukkan nilai untuk setiap alternatif</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold">Pilih Metode & Dapatkan Ranking</h3>
                <p className="text-sm text-muted-foreground">Jalankan algoritma dan lihat hasilnya</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container mx-auto px-4 text-center">
          <BarChart3 className="mx-auto mb-6 h-12 w-12" />
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Siap Memulai?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            Gunakan Decimatex sekarang untuk membuat keputusan yang lebih terukur dan objektif.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="gap-2"
          >
            Buat Keputusan Pertama <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  )
}

export default Home

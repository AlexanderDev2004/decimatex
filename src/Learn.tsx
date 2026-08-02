import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface MethodDetail {
  name: string
  fullName: string
  description: string
  formula: string
  steps: string[]
  pros: string[]
  cons: string[]
  useCases: string[]
}

const methods: MethodDetail[] = [
  {
    name: "TOPSIS",
    fullName: "Technique for Order Preference by Similarity to Ideal Solution",
    description: "TOPSIS adalah metode pengambilan keputusan multi-kriteria yang memilih alternatif terbaik berdasarkan jarak terdekat dari solusi ideal positif dan terjauh dari solusi ideal negatif.",
    formula: `Normalisasi:
r_ij = x_ij / √(Σx_ij²)

Terboboti:
v_ij = w_j × r_ij

Solusi Ideal:
A⁺ = {max(v_ij)} untuk benefit, {min(v_ij)} untuk cost
A⁻ = {min(v_ij)} untuk benefit, {max(v_ij)} untuk cost

Jarak:
D⁺_i = √(Σ(v_ij - v_j⁺)²)
D⁻_i = √(Σ(v_ij - v_j⁻)²)

Prefferensi:
P_i = D⁻_i / (D⁺_i + D⁻_i)`,
    steps: [
      "Buat matriks keputusan dengan m alternatif dan n kriteria",
      "Normalisasi matriks menggunakan rumus Euclidean",
      "Kalikan matriks normalisasi dengan bobot kriteria",
      "Tentukan solusi ideal positif dan negatif",
      "Hitung jarak setiap alternatif dari solusi ideal",
      "Hitung nilai preferensi dan ranking",
    ],
    pros: ["Mudah dihitung dan dipahami", "Hasil stabil untuk data berbeda", "Bisa digunakan untuk berbagai jenis kriteria"],
    cons: ["Bobot kriteria harus ditentukan dulu", "Tidak mempertimbangkan interaksi antar kriteria"],
    useCases: ["Pemilihan supplier", "Evaluasi kinerja", "Pemilihan lokasi"],
  },
  {
    name: "AHP",
    fullName: "Analytic Hierarchy Process",
    description: "AHP adalah metode untuk memecahkan masalah keputusan kompleks dengan membandingkan pasangan kriteria secara berjenjang.",
    formula: `Matriks Perbandingan Berpasangan (A):
a_ij = 1 jika i = j
a_ij > 1 jika i lebih penting dari j
a_ij = 1/a_ji jika j lebih penting dari i

Normalisasi Kolom:
n_ij = a_ij / Σa_ij

Bobot Kriteria (w):
w_i = Σn_ij / n

Consistency Index:
CI = (λ_max - n) / (n - 1)

Consistency Ratio:
CR = CI / RI`,
    steps: [
      "Definisikan masalah dalam struktur hierarki",
      "Buat matriks perbandingan berpasangan untuk kriteria",
      "Hitung bobot kriteria dari matriks",
      "Lakukan uji konsistensi (CR harus < 0.1)",
      "Ulangi untuk alternatif pada setiap kriteria",
      "Kalikan bobot untuk mendapatkan ranking akhir",
    ],
    pros: ["Struktur hierarkis yang jelas", "Bisa menentukan bobot secara pairwise", "Uji konsistensi untuk validitas"],
    cons: ["Sulit untuk matriks besar", "Bisa subjektif karena berdasarkan persepsi"],
    useCases: ["Pemilihan vendor", "Perencanaan strategis", "Alokasi sumber daya"],
  },
  {
    name: "EDAS",
    fullName: "Evaluation based on Distance from Average Solution",
    description: "EDAS menghitung jarak alternatif dari solusi rata-rata, memperhitungkan kriteria benefit dan cost secara bersamaan.",
    formula: `Nilai Rata-rata per Kriteria:
AV_j = Σx_ij / m

Deviasi Positif (PDA):
PDA_ij = (x_ij - AV_j) / AV_j jika benefit
PDA_ij = (AV_j - x_ij) / AV_j jika cost

Deviasi Negatif (NDA):
NDA_ij = (AV_j - x_ij) / AV_j jika benefit
NDA_ij = (x_ij - AV_j) / AV_j jika cost

Nilai Tertimbang:
SP_i = Σ(w_j × PDA_ij)
SN_i = Σ(w_j × NDA_ij)

Normalisasi:
NSP_i = SP_i / max(SP)
NSN_i = 1 - (SN_i / max(SN))

Skor:
AS_i = (NSP_i + NSN_i) / 2`,
    steps: [
      "Hitung nilai rata-rata untuk setiap kriteria",
      "Hitung deviasi positif dan negatif dari rata-rata",
      "Kalikan deviasi dengan bobot kriteria",
      "Normalisasi nilai SP dan SN",
      "Hitung skor rata-rata untuk setiap alternatif",
      "Ranking berdasarkan skor tertinggi",
    ],
    pros: ["Tidak perlu solusi ideal", "Mudah dipahami", "Hasil stabil"],
    cons: ["Bergantung pada distribusi data", "Bobot harus ditentukan dulu"],
    useCases: ["Evaluasi proyek", "Pemilihan investasi", "Penilaian risiko"],
  },
  {
    name: "PSI",
    fullName: "Preference Selection Index",
    description: "PSI adalah metode yang menggabungkan keunggulan berbagai kriteria dengan menghitung preferensi relatif setiap alternatif.",
    formula: `Normalisasi Min-Max:
n_ij = (x_ij - min_j) / (max_j - min_j) untuk benefit
n_ij = (max_j - x_ij) / (max_j - min_j) untuk cost

Preferensi Relatif:
P_ij = n_ij / Σn_ij

Indeks Preferensi:
PS_i = Σ(w_j × P_ij)`,
    steps: [
      "Normalisasi matriks menggunakan Min-Max",
      "Hitung preferensi relatif untuk setiap sel",
      "Kalikan dengan bobot kriteria",
      "Jumlahkan untuk mendapatkan skor PSI",
      "Ranking berdasarkan skor tertinggi",
    ],
    pros: ["Sederhana dan cepat", "Hasil intuitif", "Bisa untuk data tidak lengkap"],
    cons: ["Bobot harus diketahui", "Tidak cocok untuk data diskrit"],
    useCases: ["Seleksi karyawan", "Pemilihan produk", "Evaluasi kebijakan"],
  },
  {
    name: "VIKOR",
    fullName: "VIseKriterijumska Optimizacija I Kompromisno Resenje",
    description: "VIKOR adalah metode compromisso ranking yang mengoptimalkan kriteria benefit dan cost dengan mempertimbangkan preferensi pengambil keputusan.",
    formula: `Normalisasi:
f_ij* = max(x_ij), f_j⁻ = min(x_ij)

Nilai Ternormalisasi:
r_ij = (f_ij* - x_ij) / (f_ij* - f_j⁻) untuk benefit
r_ij = (x_ij - f_j⁻) / (f_ij* - f_j⁻) untuk cost

Utility Measure:
S_i = Σ(w_j × r_ij)
R_i = max(w_j × r_ij)

Indeks VIKOR:
Q_i = v × (S_i - S*) / (S⁻ - S*) + (1-v) × (R_i - R*) / (R⁻ - R*)`,
    steps: [
      "Tentukan solusi ideal dan negatif untuk setiap kriteria",
      "Normalisasi matriks keputusan",
      "Hitung utility measure S dan regret measure R",
      "Hitung indeks VIKOR dengan parameter v",
      "Ranking berdasarkan nilai Q terkecil",
    ],
    pros: ["Bisa atur tingkat compromise", "Pertimbangkan kedua jenis kriteria", "Hasil akurat"],
    cons: ["Parameter v harus ditentukan", "Kompleksitas medium"],
    useCases: ["Pemilihan supplier", "Evaluasi teknologi", "Perencanaan kota"],
  },
  {
    name: "MOORA",
    fullName: "Multi-Objective Optimization on the basis of Ratio Analysis",
    description: "MOORA mengoptimalkan beberapa tujuan secara bersamaan dengan menganalisis rasio alternatif terhadap kriteria.",
    formula: `Normalisasi:
r_ij = x_ij / √(Σx_ij²)

Nilai Terboboti:
y_ij = w_j × r_ij

Indeks MOORA:
Y_i = Σ(y_ij) untuk benefit - Σ(y_ij) untuk cost`,
    steps: [
      "Normalisasi matriks keputusan",
      "Kalikan dengan bobot kriteria",
      "Jumlahkan nilai benefit dikurangi cost",
      "Ranking berdasarkan nilai Y terbesar",
    ],
    pros: ["Sederhana dan cepat", "Langsung dapat hasil", "Mudah diimplementasikan"],
    cons: ["Bobot harus predetermined", "Tidak ada solusi ideal"],
    useCases: ["Pemilihan material", "Optimasi produksi", "Evaluasi kinerja"],
  },
  {
    name: "ELECTRE",
    fullName: "ELimination and Choice Expressing REality",
    description: "ELECTRE mengeliminasialternatif yang dominated dan memilih berdasarkan concordance dan discordance index.",
    formula: `Concordance Index:
C_jk = Σw_j untuk semua j dimana x_ij ≥ x_kj

Discordance Index:
D_jk = max|x_ij - x_kj| / max|x_ij - x_kj| untuk semua j

Indeks ELECTRE:
E_jk = C_jk × (1 - D_jk)`,
    steps: [
      "Normalisasi matriks keputusan",
      "Buat matriks concordance dan discordance",
      "Hitung indeks concordance dan discordance",
      "Tentukan threshold untuk eliminasi",
      "Buat grafik outranking",
      "Dapatkan ranking dari grafik",
    ],
    pros: ["Bisa handle data kualitatif", "Tidak perlu normalisasi", "Fleksibel"],
    cons: ["Kompleks", "Hasil bisa berbeda-beda", "Sulit dipahami"],
    useCases: ["Pemilihan energi", "Evaluasi lingkungan", "Strategi bisnis"],
  },
  {
    name: "PROMETHEE",
    fullName: "Preference Ranking Organization METHod for Enrichment of Evaluations",
    description: "PROMETHEE adalah metode outranking yang membandingkan pasangan alternatif menggunakan fungsi preferensi.",
    formula: `Preference Function:
P(a,b) =  ≤ b
P0 jika a(a,b) = f(a-b) jika a > b

Multi-criteria Preference Index:
π(a,b) = Σ(w_j × P_j(a,b)) / Σw_j

Positive Outranking Flow:
φ⁺(a) = π(a,b) untuk semua b

Negative Outranking Flow:
φ⁻(a) = π(b,a) untuk semua b

Net Flow:
φ(a) = φ⁺(a) - φ⁻(a)`,
    steps: [
      "Pilih fungsi preferensi yang sesuai",
      "Hitung preference index untuk setiap pasangan",
      "Hitung positive dan negative outranking flow",
      "Hitung net flow",
      "Ranking berdasarkan net flow tertinggi",
    ],
    pros: ["Visualisasi dengan GAIA", "Fleksibel dengan preference function", "Bisa handle data kualitatif"],
    cons: ["Fungsi preferensi harus dipilih", "Bisa subjektif"],
    useCases: ["Evaluasi proyek", "Pemilihan lokasi", "Manajemen risiko"],
  },
  {
    name: "COPRAS",
    fullName: "COmplex PRoportional ASsessment",
    description: "COPRAS menghitung utilitas relatif alternatif berdasarkan kriteria benefit dan cost secara proporsional.",
    formula: `Normalisasi:
n_ij = x_ij / Σx_ij

Terboboti:
q_ij = w_j × n_ij

S_plus = Σq_ij untuk benefit
S_minus = Σq_ij untuk cost

Utility Degree:
U_i = S_plus + (ΣS_minus - S_minus) / ΣS_minus × S_minus`,
    steps: [
      "Normalisasi matriks secara proporsional",
      "Kalikan dengan bobot kriteria",
      "Hitung jumlah untuk kriteria benefit dan cost",
      "Hitung utility degree",
      "Ranking berdasarkan U tertinggi",
    ],
    pros: ["Langsung dapat utilitas", "Cukup akurat", "Mudah dihitung"],
    cons: ["Bobot harus fixed", "Tidak ada solusi ideal"],
    useCases: ["Pemilihan supplier", "Evaluasi investasi", "Seleksi personnel"],
  },
]

function Learn() {
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const activeMethod = methods.find(m => m.name === selectedMethod)

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Home
        </Button>

        {!selectedMethod ? (
          <>
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-3xl font-bold md:text-4xl">
                Pelajari Metode DSS
              </h1>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Decimatex mendukung berbagai metode Multi-Criteria Decision Making (MCDM). 
                Pilih metode di bawah untuk memahami rumus dan cara kerjanya.
              </p>
            </div>

            <div id="learn-list" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {methods.map((method) => (
                <Card 
                  key={method.name} 
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                  onClick={() => setSelectedMethod(method.name)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{method.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-2 text-lg">{method.fullName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{method.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedMethod(null)} 
              className="mb-6 gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Lihat Semua Metode
            </Button>

            {activeMethod && (
              <div className="space-y-8">
                <div>
                  <h1 className="mb-2 text-3xl font-bold">{activeMethod.name}</h1>
                  <p className="text-lg text-muted-foreground">{activeMethod.fullName}</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Deskripsi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-7">{activeMethod.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rumus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                      <code>{activeMethod.formula}</code>
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Langkah-langkah</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal space-y-2 pl-5">
                      {activeMethod.steps.map((step, index) => (
                        <li key={index} className="leading-7">{step}</li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Kelebihan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {activeMethod.pros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Kekurangan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {activeMethod.cons.map((con, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-600">✗</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Penggunaan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {activeMethod.useCases.map((useCase, index) => (
                        <span key={index} className="rounded-full border px-3 py-1 text-xs">{useCase}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default Learn

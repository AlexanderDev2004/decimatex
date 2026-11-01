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
r_ij = x_ij / √(Σ_i x_ij²)

Terboboti:
v_ij = w_j × r_ij

Solusi Ideal:
A⁺ = {max(v_ij)} untuk benefit, {min(v_ij)} untuk cost
A⁻ = {min(v_ij)} untuk benefit, {max(v_ij)} untuk cost

Jarak:
D⁺_i = √(Σ_j (v_ij - v_j⁺)²)
D⁻_i = √(Σ_j (v_ij - v_j⁻)²)

Preferensi:
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
    description: "AHP adalah metode untuk memecahkan masalah keputusan kompleks dengan membandingkan pasangan kriteria secara berjenjang dalam struktur hierarki, sehingga bobot kriteria diperoleh dari penilaian perbandingan berpasangan.",
    formula: `Matriks Perbandingan Berpasangan (A):
a_ij = 1 jika i = j
a_ij > 1 jika i lebih penting dari j
a_ij = 1/a_ji jika j lebih penting dari i

Normalisasi Kolom:
n_ij = a_ij / Σ_i a_ij

Bobot Kriteria (w):
w_i = Σ_j n_ij / n

Consistency Index:
CI = (λ_max - n) / (n - 1)

Consistency Ratio:
CR = CI / RI  (harus < 0,1)`,
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
    description: "EDAS menghitung jarak setiap alternatif dari solusi rata-rata (average solution) menggunakan deviasi positif (PDA) dan deviasi negatif (NDA). Alternatif yang lebih baik dari rata-rata mendapat PDA, yang lebih buruk mendapat NDA.",
    formula: `Nilai Rata-rata per Kriteria:
AV_j = Σ_i x_ij / m

Deviasi Positif (PDA):
PDA_ij = (x_ij - AV_j) / AV_j   jika benefit
PDA_ij = (AV_j - x_ij) / AV_j   jika cost

Deviasi Negatif (NDA):
NDA_ij = (AV_j - x_ij) / AV_j   jika benefit
NDA_ij = (x_ij - AV_j) / AV_j   jika cost

Nilai Tertimbang:
SP_i = Σ_j (w_j × PDA_ij)
SN_i = Σ_j (w_j × NDA_ij)

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
    pros: ["Tidak perlu solusi ideal", "Mudah dipahami", "Deviasi boleh negatif tanpa pembatasan"],
    cons: ["Bergantung pada distribusi data", "Bobot harus ditentukan dulu"],
    useCases: ["Evaluasi proyek", "Pemilihan investasi", "Penilaian risiko"],
  },
  {
    name: "PSI",
    fullName: "Preference Selection Index",
    description: "PSI adalah metode objektif yang menentukan bobot kriteria secara otomatis dari sebaran data (tanpa penilaian pengambil keputusan), lalu menghitung indeks preferensi setiap alternatif. Kriteria dengan variasi antar-alternatif lebih besar dianggap lebih penting.",
    formula: `Normalisasi Vektor (Maniya & Bhatt, 2010):
n_ij = x_ij / √(Σ_i x_ij²)                jika benefit
n_ij = (1/x_ij) / √(Σ_i (1/x_ij)²)        jika cost

Preferensi Relatif:
p_ij = n_ij / Σ_i n_ij

Preference Variation:
PV_j = Σ_i (p_ij - mean_j)²

Bobot Objektif:
ψ_j = √(PV_j) / Σ_j √(PV_j)

Indeks Preferensi:
PSI_i = Σ_j (n_ij × ψ_j)`,
    steps: [
      "Normalisasi matriks dengan normalisasi vektor (cost memakai reciprocal)",
      "Hitung preferensi relatif setiap sel",
      "Hitung preference variation setiap kriteria",
      "Hitung bobot objektif dari variasi preferensi",
      "Jumlahkan nilai ternormalisasi terbobot untuk mendapatkan skor PSI",
      "Ranking berdasarkan skor tertinggi",
    ],
    pros: ["Bobot kriteria dihitung objektif dari data", "Tidak butuh penilaian subjektif pengambil keputusan", "Sederhana dan cepat"],
    cons: ["Tidak memakai pengetahuan/tujuan pengambil keputusan untuk bobot", "Butuh data numerik positif (cost memakai reciprocal)", "Semua kolom identik menghasilkan bobot rata-rata"],
    useCases: ["Seleksi material", "Pemilihan produk", "Evaluasi kebijakan"],
  },
  {
    name: "VIKOR",
    fullName: "VIseKriterijumska Optimizacija I Kompromisno Resenje",
    description: "VIKOR adalah metode multi-kriteria optimisasi dan kompromi yang merangking alternatif berdasarkan ukuran utility (S) dan regret (R) terhadap solusi ideal, dengan parameter v sebagai bobot utilitas grup.",
    formula: `Solusi Ideal dan Anti-Ideal:
f_j* = nilai terbaik   (max benefit / min cost)
f_j⁻ = nilai terburuk  (min benefit / max cost)

Nilai Ternormalisasi:
r_ij = (f_j* - x_ij) / (f_j* - f_j⁻)   jika benefit
r_ij = (x_ij - f_j⁻) / (f_j* - f_j⁻)   jika cost

Utility Measure dan Regret Measure:
S_i = Σ_j (w_j × r_ij)
R_i = max_j (w_j × r_ij)

Indeks VIKOR:
Q_i = v × (S_i - S*) / (S⁻ - S*) + (1 - v) × (R_i - R*) / (R⁻ - R*)

dengan S* = min(S), S⁻ = max(S), R* = min(R), R⁻ = max(R)`,
    steps: [
      "Tentukan solusi ideal (f*) dan anti-ideal (f⁻) untuk setiap kriteria",
      "Normalisasi matriks keputusan",
      "Hitung utility measure S dan regret measure R",
      "Hitung indeks VIKOR dengan parameter v",
      "Ranking berdasarkan nilai Q terkecil",
    ],
    pros: ["Bisa atur tingkat kompromi lewat parameter v", "Mempertimbangkan utilitas grup dan regret individu", "Solusi kompromi yang diterima semua pihak"],
    cons: ["Parameter v harus ditentukan pengambil keputusan", "Interpretasi hasil lebih kompleks dari SAW/TOPSIS"],
    useCases: ["Pemilihan supplier", "Evaluasi teknologi", "Perencanaan kota"],
  },
  {
    name: "MOORA",
    fullName: "Multi-Objective Optimization on the basis of Ratio Analysis",
    description: "MOORA mengoptimalkan beberapa tujuan secara bersamaan dengan normalisasi rasio: nilai kriteria benefit dijumlahkan dan kriteria cost dikurangkan dalam satu skor tunggal.",
    formula: `Normalisasi:
r_ij = x_ij / √(Σ_i x_ij²)

Nilai Terboboti:
y_ij = w_j × r_ij

Indeks MOORA:
Y_i = Σ_j (y_ij untuk benefit) - Σ_j (y_ij untuk cost)`,
    steps: [
      "Normalisasi matriks keputusan dengan rasio",
      "Kalikan dengan bobot kriteria",
      "Jumlahkan nilai benefit dikurangi cost",
      "Ranking berdasarkan nilai Y terbesar",
    ],
    pros: ["Sederhana dan cepat", "Langsung dapat hasil", "Mudah diimplementasikan"],
    cons: ["Bobot harus ditentukan sebelumnya", "Tidak ada konsep solusi ideal"],
    useCases: ["Pemilihan material", "Optimasi produksi", "Evaluasi kinerja"],
  },
  {
    name: "ELECTRE",
    fullName: "ELimination and Choice Expressing REality",
    description: "ELECTRE adalah metode outranking yang membangun relasi dominasi antar pasangan alternatif melalui indeks concordance (kesepakatan) dan discordance (penolakan), lalu mengeliminasi alternatif yang didominasi.",
    formula: `Concordance Index (pasangan a vs b):
c_ab = Σ_j w_j  untuk semua j dimana x_aj ≥ x_bj

Discordance Index (pasangan a vs b):
d_ab = max_{j∈K} |x_aj - x_bj| / max_j |x_aj - x_bj|
dengan K = himpunan kriteria dimana x_aj < x_bj

Dominasi Outranking:
Pasangan (a, b) outranking jika c_ab ≥ c̄ dan d_ab ≤ d̄
(c̄ = concordance threshold, d̄ = discordance threshold)`,
    steps: [
      "Normalisasi matriks keputusan",
      "Buat matriks concordance dan discordance",
      "Hitung indeks concordance dan discordance antar pasangan",
      "Tentukan threshold untuk eliminasi",
      "Buat graf outranking",
      "Dapatkan ranking dari graf (eliminasi alternatif yang didominasi)",
    ],
    pros: ["Bisa handle data kualitatif", "Fleksibel dengan threshold", "Relasi outranking lebih realistis dari skor tunggal"],
    cons: ["Kompleks", "Hasil bisa berbeda-beda tergantung threshold", "Sulit dipahami"],
    useCases: ["Pemilihan energi", "Evaluasi lingkungan", "Strategi bisnis"],
  },
  {
    name: "PROMETHEE",
    fullName: "Preference Ranking Organization METHod for Enrichment of Evaluations",
    description: "PROMETHEE adalah metode outranking yang membandingkan setiap pasangan alternatif menggunakan fungsi preferensi, lalu merangking berdasarkan positive flow, negative flow, dan net flow.",
    formula: `Preference Function (tipe I):
P_j(a, b) = 0                  jika f_j(a) ≤ f_j(b)
P_j(a, b) = f_j(a) - f_j(b)    jika f_j(a) > f_j(b)

Multi-criteria Preference Index:
π(a, b) = Σ_j (w_j × P_j(a, b)) / Σ_j w_j

Positive Outranking Flow:
φ⁺(a) = Σ_b π(a, b) / (n - 1)

Negative Outranking Flow:
φ⁻(a) = Σ_b π(b, a) / (n - 1)

Net Flow:
φ(a) = φ⁺(a) - φ⁻(a)`,
    steps: [
      "Pilih fungsi preferensi yang sesuai untuk setiap kriteria",
      "Hitung preference index untuk setiap pasangan alternatif",
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
    description: "COPRAS menghitung utilitas relatif setiap alternatif dengan memisahkan kriteria benefit (S+) dan cost (S−) secara proporsional, lalu mengukur derajat utilitas terhadap alternatif terbaik.",
    formula: `Normalisasi:
n_ij = x_ij / Σ_i x_ij

Terboboti:
q_ij = w_j × n_ij

Jumlah Benefit dan Cost:
S⁺_i = Σ_j q_ij untuk benefit
S⁻_i = Σ_j q_ij untuk cost

Skor COPRAS:
Q_i = S⁺_i + S⁻_min / S⁻_i
dengan S⁻_min = min_i(S⁻_i)

Derajat Utilitas:
N_i = (Q_i / Q_max) × 100%`,
    steps: [
      "Normalisasi matriks secara proporsional (jumlah kolom = 1)",
      "Kalikan dengan bobot kriteria",
      "Hitung jumlah untuk kriteria benefit (S+) dan cost (S−)",
      "Hitung skor Q dan derajat utilitas N",
      "Ranking berdasarkan N tertinggi",
    ],
    pros: ["Hasil berupa derajat utilitas yang mudah dibaca", "S⁺ dan S− diproses terpisah sehingga informatif", "Mudah dihitung"],
    cons: ["Bobot harus ditentukan sebelumnya", "Tidak ada konsep solusi ideal"],
    useCases: ["Pemilihan supplier", "Evaluasi investasi", "Seleksi personnel"],
  },
  {
    name: "SAW",
    fullName: "Simple Additive Weighting",
    description: "SAW adalah metode paling sederhana: semua nilai alternatif dinormalisasi ke skala yang sama, dikalikan bobot kriteria, lalu dijumlahkan menjadi satu skor akhir.",
    formula: `Normalisasi:
r_ij = x_ij / max_i(x_ij)    jika benefit
r_ij = min_i(x_ij) / x_ij    jika cost

Skor Akhir:
S_i = Σ_j (w_j × r_ij)`,
    steps: [
      "Normalisasi matriks keputusan (divisi nilai maksimum untuk benefit, minimum untuk cost)",
      "Kalikan nilai ternormalisasi dengan bobot kriteria",
      "Jumlahkan per alternatif untuk mendapat skor akhir",
      "Ranking berdasarkan skor tertinggi",
    ],
    pros: ["Paling sederhana dan cepat", "Mudah dipahami semua kalangan", "Hasil konsisten dengan preferensi additive"],
    cons: ["Asumsi preferensi linier dan independen antar kriteria", "Skala skornya sangat sensitif terhadap nilai maksimum/minimun"],
    useCases: ["Pemilihan supplier", "Seleksi karyawan", "Penilaian sederhana sehari-hari"],
  },
  {
    name: "WP",
    fullName: "Weighted Product Model",
    description: "WP adalah metode multiplicative: skor setiap alternatif adalah perkalian semua nilai kriteria yang dipangkatkan bobotnya. Kriteria cost memakai pangkat bobot negatif.",
    formula: `Skor WP:
S_i = Π_j (x_ij)^w_j      untuk benefit
      dengan eksponen cost = -w_j

Bentuk logaritmik:
ln S_i = Σ_j (±w_j × ln x_ij)
(+w_j untuk benefit, -w_j untuk cost)

Vektor preferensi relatif:
V_i = S_i / Σ_i S_i`,
    steps: [
      "Pastikan semua nilai matriks positif",
      "Pangkatkan nilai tiap kriteria dengan bobotnya (negatif untuk cost)",
      "Kalikan semua nilai terpangkatkan untuk mendapat S",
      "Normalisasi menjadi vektor preferensi relatif V",
      "Ranking berdasarkan V tertinggi",
    ],
    pros: ["Memodelkan hubungan multiplicative antar kriteria", "Sifat skala-bebas (scale-invariant)", "Sesuai untuk kasus rasio/efisiensi"],
    cons: ["Semua nilai harus positif (tidak bisa nol/negatif)", "Interpretasi pangkat kurang intuitif", "Bobot harus ditentukan sebelumnya"],
    useCases: ["Analisis rasio keuangan", "Evaluasi efisiensi", "Pemilihan dengan relasi perkalian"],
  },
  {
    name: "WASPAS",
    fullName: "Weighted Aggregated Sum Product ASsessment",
    description: "WASPAS menggabungkan pendekatan additive (WSM/SAW) dan multiplicative (WPM) menjadi satu skor gabungan dengan parameter λ, sehingga memanfaatkan kelebihan kedua pendekatan.",
    formula: `Normalisasi SAW:
r_ij = x_ij / max_i(x_ij)    jika benefit
r_ij = min_i(x_ij) / x_ij    jika cost

Skor WSM (additive):
Q1_i = Σ_j (w_j × r_ij)

Skor WPM (multiplicative):
Q2_i = Π_j (r_ij)^w_j

Skor Gabungan (lambda = 0.5):
Q_i = λ × Q1_i + (1 - λ) × Q2_i`,
    steps: [
      "Normalisasi matriks keputusan seperti SAW",
      "Hitung skor WSM (penjumlahan tertimbang)",
      "Hitung skor WPM (perkalian terpangkatkan)",
      "Gabungkan dengan parameter lambda (default 0.5)",
      "Ranking berdasarkan skor gabungan tertinggi",
    ],
    pros: ["Akurasi lebih tinggi dari WSM atau WPM saja", "Parameter lambda bisa dikalibrasi", "Menggabungkan dua sudut pandang preferensi"],
    cons: ["Nilai harus positif untuk bagian multiplicative", "Perlu eksperimen lambda untuk hasil optimal"],
    useCases: ["Pemilihan kontraktor", "Evaluasi proyek teknik", "Seleksi vendor"],
  },
  {
    name: "ARAS",
    fullName: "Additive Ratio ASsessment",
    description: "ARAS membandingkan utilitas setiap alternatif terhadap alternatif optimal: nilai ternormalisasi dijumlahkan terbobot menjadi S, lalu derajat utilitas K dihitung sebagai rasio S terhadap S optimal (S₀).",
    formula: `Normalisasi:
n_ij = x_ij / Σ_i x_ij                              jika benefit
n_ij = (1/x_ij) / Σ_i (1/x_ij)                      jika cost

Skor Tertimbang:
S_i = Σ_j (w_j × n_ij)

Skor Optimal:
S₀ = Σ_j (w_j × max_i(n_ij))

Derajat Utilitas:
K_i = S_i / S₀   (semakin dekat ke 1 semakin optimal)`,
    steps: [
      "Normalisasi matriks (sum-bagian; cost memakai reciprocal)",
      "Hitung skor tertimbang S setiap alternatif",
      "Tentukan skor optimal S0 dari nilai terbaik tiap kriteria",
      "Hitung derajat utilitas K = S/S0",
      "Ranking berdasarkan K tertinggi",
    ],
    pros: ["Hasil berupa derajat utilitas yang mudah diinterpretasi", "Kriteria benefit dan cost tertangani jelas", "Perhitungan sederhana"],
    cons: ["Butuh nilai positif untuk kriteria cost", "Bobot harus ditentukan sebelumnya"],
    useCases: ["Pemilihan desain produk", "Evaluasi kinerja", "Seleksi proyek"],
  },
  {
    name: "GRA",
    fullName: "Grey Relational Analysis",
    description: "GRA adalah metode analisis relasional grey yang mengukur kemiripan pola setiap alternatif terhadap sekuens referensi ideal. Semakin besar koefisien relasi grey, semakin mirip alternatif dengan solusi ideal.",
    formula: `Normalisasi Min-Max:
r_ij = (x_ij - min_j) / (max_j - min_j)    jika benefit
r_ij = (max_j - x_ij) / (max_j - min_j)    jika cost

Selisih dari referensi (referensi = 1):
Δ_ij = |1 - r_ij|
Δ_min = min(Δ_ij),  Δ_max = max(Δ_ij)

Koefisien Relasi Grey (ζ = 0.5):
ξ_ij = (Δ_min + ζ × Δ_max) / (Δ_ij + ζ × Δ_max)

Derajat Relasi Grey:
γ_i = Σ_j (w_j × ξ_ij)`,
    steps: [
      "Normalisasi matriks dengan min-max",
      "Hitung selisih absolut setiap nilai dari sekuens referensi (1)",
      "Tentukan Δ_min dan Δ_max global",
      "Hitung koefisien relasi grey dengan resolving coefficient ζ = 0.5",
      "Rata-ratakan terbobot untuk mendapat derajat relasi grey",
      "Ranking berdasarkan γ tertinggi",
    ],
    pros: ["Cocok untuk data kecil dan tidak lengkap (grey system)", "Tidak butuh asumsi distribusi data", "Robust terhadap outlier berkat resolving coefficient"],
    cons: ["Hasil sensitif terhadap nilai ζ", "Interpretasi derajat relasi kurang lazim untuk awam"],
    useCases: ["Optimasi parameter manufaktur", "Evaluasi kinerja", "Analisis data eksperimen"],
  },
  {
    name: "Entropy",
    fullName: "Entropy Weight Method (penentu bobot objektif)",
    description: "Metode Entropy bukan metode ranking, melainkan penentu bobot kriteria secara objektif: kriteria dengan variasi data antar-alternatif lebih besar mendapat bobot lebih besar. Bobot hasilnya bisa dipakai bersama metode ranking apa pun (SAW, TOPSIS, dll).",
    formula: `Normalisasi:
p_ij = x_ij / Σ_i x_ij                          jika benefit
p_ij = (1/x_ij) / Σ_i (1/x_ij)                  jika cost

Nilai Entropy:
e_j = -k × Σ_i (p_ij × ln p_ij),  k = 1 / ln(m)
(konvensi: p_ij × ln p_ij = 0 jika p_ij = 0)

Divergensi:
d_j = 1 - e_j

Bobot:
w_j = d_j / Σ_j d_j
(semua d_j = 0 → bobot rata-rata 1/n)`,
    steps: [
      "Normalisasi setiap kolom kriteria (cost memakai reciprocal)",
      "Hitung nilai entropy e_j tiap kriteria",
      "Hitung divergensi d_j = 1 - e_j",
      "Normalisasi divergensi menjadi bobot w_j",
      "Terapkan bobot pada metode ranking pilihan Anda",
    ],
    pros: ["Bobot sepenuhnya objektif dari sebaran data", "Mengurangi subjektivitas penilaian manual", "Bisa dikombinasikan dengan semua metode ranking"],
    cons: ["Mengabaikan pengetahuan/tujuan pengambil keputusan", "Tidak menghasilkan ranking alternatif", "Kolom data identik mendapat bobot nol"],
    useCases: ["Penentuan bobot otomatis", "Kombinasi dengan SAW/TOPSIS/VIKOR", "Validasi bobot subjektif (misal AHP)"],
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

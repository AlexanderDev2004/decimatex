# Decimatex DB Schema

Schema utama DSS menggunakan PostgreSQL + Drizzle disimpan di `src/server/db/schema.ts`.

## Entitas inti

- `decision_problems`: skenario keputusan
- `criteria`: kriteria per decision + bobot + tipe (benefit/cost)
- `alternatives`: opsi per decision
- `decision_matrix_values`: nilai matriks keputusan
- `methods`: katalog metode DSS
- `analysis_runs`: histori eksekusi metode
- `analysis_results`: skor/rank per alternatif

## Aturan penting

- Nama kriteria/alternatif unik dalam satu decision.
- Matrix value memakai PK komposit (`decision_id`, `alternative_id`, `criteria_id`).
- Hasil analisis (`analysis_results`) wajib sesuai decision yang sama dengan run.
- `rank` harus positif.

## Seed metode DSS

Migration awal (`drizzle/0000_swift_mac_gargan.sql`) otomatis menambahkan metode:

- AHP
- TOPSIS
- EDAS
- PSI
- VIKOR
- MOORA
- ELECTRE
- PROMETHEE
- COPRAS

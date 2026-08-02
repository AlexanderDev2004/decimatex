import type { DriveStep } from "driver.js"

/**
 * Langkah tutorial per halaman (berdasarkan pathname React Router).
 * Elemen yang tidak ada di DOM otomatis dilewati (skipMissingElement).
 */
export function getTutorialSteps(pathname: string): DriveStep[] {
	if (pathname === "/decision/matrix") {
		return [
			{
				popover: {
					title: "Workspace Keputusan",
					description:
						"Di halaman ini Anda mengisi data keputusan: kriteria, alternatif, nilai matriks, lalu menghitung ranking.",
				},
			},
			{
				element: "#criteria-input",
				popover: {
					title: "1. Tambahkan Kriteria",
					description:
						"Ketik nama kriteria (misal: Harga, Kualitas) lalu pilih jenisnya: Benefit (semakin besar semakin baik) atau Cost (semakin kecil semakin baik). Tekan Enter atau tombol +.",
					side: "bottom",
					align: "start",
				},
			},
			{
				element: "#criteria-list",
				popover: {
					title: "Atur Bobot Kriteria",
					description:
						"Setiap kriteria punya bobot kepentingan. Ubah bobot di sini, atau nonaktifkan bobot untuk memakai bobot sama rata. Minimal 2 kriteria diperlukan.",
					side: "bottom",
				},
			},
			{
				element: "#alternative-input",
				popover: {
					title: "2. Tambahkan Alternatif",
					description:
						"Alternatif adalah pilihan yang akan dievaluasi, misalnya Supplier A, Supplier B. Minimal 2 alternatif diperlukan.",
					side: "bottom",
					align: "start",
				},
			},
			{
				element: "#alternative-list",
				popover: {
					title: "Daftar Alternatif",
					description:
						"Semua alternatif yang sudah ditambahkan tampil di sini. Hapus dengan ikon tempat sampah.",
					side: "bottom",
				},
			},
			{
				element: "#matrix-table",
				popover: {
					title: "3. Isi Matriks Keputusan",
					description:
						"Isi nilai setiap alternatif untuk setiap kriteria. Nilai inilah yang diproses algoritma DSS (normalisasi, pembobotan, hingga ranking).",
					side: "top",
				},
			},
			{
				element: "#calc-button",
				popover: {
					title: "4. Hitung Ranking",
					description:
						"Setelah data lengkap, klik tombol ini untuk menjalankan perhitungan dengan metode yang dipilih.",
					side: "top",
				},
			},
			{
				element: "#save-result",
				popover: {
					title: "5. Simpan Hasil",
					description:
						"Simpan hasil analisis ke database. Hasil akan tersedia di halaman History.",
					side: "top",
				},
			},
		]
	}

	if (pathname === "/decision") {
		return [
			{
				element: "#decision-name-input",
				popover: {
					title: "Beri Nama Keputusan",
					description:
						"Tuliskan nama masalah keputusan Anda, misalnya \"Pemilihan Supplier Bahan Baku\".",
					side: "bottom",
					align: "start",
				},
			},
			{
				element: "#method-grid",
				popover: {
					title: "Pilih Metode DSS",
					description:
						"Pilih salah satu dari 9 metode Multi-Criteria Decision Making. Klik kartu metode untuk memilihnya.",
					side: "bottom",
				},
			},
			{
				element: "#continue-button",
				popover: {
					title: "Lanjutkan",
					description:
						"Setelah nama dan metode terisi, klik tombol ini untuk mulai mengisi data keputusan.",
					side: "top",
				},
			},
		]
	}

	if (pathname === "/history") {
		return [
			{
				element: "#history-search",
				popover: {
					title: "Cari Keputusan",
					description:
						"Gunakan kolom ini untuk mencari keputusan yang sudah disimpan.",
					side: "bottom",
					align: "start",
				},
			},
			{
				element: "#history-list",
				popover: {
					title: "Riwayat Keputusan",
					description:
						"Setiap kartu berisi satu keputusan. Klik kartu untuk melihat detail, hasil analisis, atau gunakan tombol salin (duplikat) dan hapus.",
					side: "top",
				},
			},
		]
	}

	if (pathname.startsWith("/history/")) {
		return [
			{
				popover: {
					title: "Detail Keputusan",
					description:
						"Halaman ini menampilkan informasi lengkap keputusan: daftar kriteria, alternatif, dan hasil analisis terbaru dengan metodenya.",
				},
			},
		]
	}

	if (pathname === "/learn") {
		return [
			{
				element: "#learn-list",
				popover: {
					title: "Pelajari Metode DSS",
					description:
						"Pilih metode untuk melihat penjelasan lengkap: rumus, langkah-langkah, kelebihan, dan contoh penggunaan.",
					side: "bottom",
				},
			},
		]
	}

	// Home dan halaman lain
	return [
		{
			popover: {
				title: "Selamat Datang di Decimatex 👋",
				description:
					"Platform Sistem Pendukung Keputusan (SPK) dengan 9 metode MCDM: TOPSIS, AHP, EDAS, PSI, VIKOR, MOORA, ELECTRE, PROMETHEE, dan COPRAS.",
			},
		},
		{
			element: "#nav-create",
			popover: {
				title: "Buat Keputusan Baru",
				description:
					"Mulai analisis keputusan baru: pilih metode, isi kriteria dan alternatif, lalu dapatkan ranking otomatis.",
				side: "bottom",
			},
		},
		{
			element: "#nav-history",
			popover: {
				title: "History",
				description:
					"Lihat kembali semua keputusan dan hasil analisis yang pernah disimpan.",
				side: "bottom",
			},
		},
	]
}

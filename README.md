# Decimatex

Frontend project untuk Decimatex (Decision Support System) menggunakan React + TypeScript + Vite, dengan UI berbasis Tailwind CSS v4 dan shadcn/ui.

## Analisis Kondisi Proyek Saat Ini

Berikut hasil analisis struktur dan setup terbaru:

1. **Framework & Build**
- Menggunakan Vite + React + TypeScript.
- Script aktif di `package.json`: `dev`, `build`, `lint`, `preview`.

2. **Routing & Data Layer**
- Routing menggunakan `react-router-dom` (`createBrowserRouter`).
- `QueryClientProvider` dari TanStack Query sudah dipasang di root app.

3. **UI System**
- shadcn/ui sudah terinisialisasi (`components.json` tersedia).
- Tailwind CSS v4 aktif via `@tailwindcss/vite`.
- Alias `@/*` sudah aktif di TypeScript dan Vite.
- Komponen shadcn yang sudah tersedia:
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/card.tsx`

4. **Status Implementasi Halaman**
- `src/Home.tsx` sudah memakai contoh nyata `Card`, `Input`, dan `Button`.
- Build terakhir dalam kondisi sukses.

## Tech Stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS v4
- shadcn/ui
- TanStack Query
- React Router DOM

## Menjalankan Proyek

```bash
# install dependencies
bun install

# development server
bun run dev

# production build
bun run build

# lint
bun run lint

# preview build
bun run preview
```

## Menambah Komponen shadcn/ui

Setelah `init`, tambahkan komponen dengan command `add`.

```bash
# satu komponen
bunx shadcn@latest add button

# beberapa komponen sekaligus
bunx shadcn@latest add input card dialog
```

Komponen akan dibuat di `src/components/ui`.

## Cara Pakai Komponen (Contoh)

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ExampleForm() {
  return (
    <div className="space-y-3">
      <Input type="email" placeholder="you@example.com" />
      <Button>Kirim</Button>
    </div>
  )
}
```

Contoh penggunaan lebih lengkap ada di `src/Home.tsx`.

## Struktur Direktori Ringkas

```txt
src/
  components/
    ui/
      button.tsx
      card.tsx
      input.tsx
  lib/
    utils.ts
  App.tsx
  Home.tsx
  router.tsx
  index.css
```

## Catatan Konfigurasi Penting

- File konfigurasi shadcn: `components.json`
- CSS utama shadcn + Tailwind: `src/index.css`
- Alias path `@/*`:
  - `tsconfig.json`
  - `tsconfig.app.json`
  - `vite.config.ts`

Jika komponen baru tidak muncul style-nya, cek bahwa `src/index.css` masih mengimpor:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

import { useCallback, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { driver, type Driver } from "driver.js"
import "driver.js/dist/driver.css"
import { getTutorialSteps } from "./tutorial-steps"

export const TUTORIAL_SEEN_KEY = "decimatex:tutorial:seen"

let tutorialDriver: Driver | null = null

function getDriver(): Driver {
	if (!tutorialDriver) {
		tutorialDriver = driver({
			showProgress: true,
			showButtons: ["previous", "next", "close"],
			progressText: "Langkah {{current}} dari {{total}}",
			nextBtnText: "Lanjut",
			prevBtnText: "Kembali",
			doneBtnText: "Selesai",
			skipMissingElement: true,
			waitForElement: 600,
			animate: true,
			overlayColor: "rgba(2, 6, 23, 0.6)",
		})
	}
	return tutorialDriver
}

export function isTutorialSeen(): boolean {
	try {
		return localStorage.getItem(TUTORIAL_SEEN_KEY) === "1"
	} catch {
		return false
	}
}

export function markTutorialSeen(): void {
	try {
		localStorage.setItem(TUTORIAL_SEEN_KEY, "1")
	} catch {
		// localStorage tidak tersedia (private mode dll.) — abaikan
	}
}

/**
 * Tutorial Driver.js sekali pakai per browser.
 * - Auto-tampil hanya pada kunjungan pertama (flag disimpan di localStorage,
 *   sehingga reload / hapus data / buka halaman lagi tidak memunculkannya).
 * - `startTutorial()` dipakai tombol "Tutorial" di navbar untuk memutar ulang
 *   secara manual kapan saja.
 */
export function useTutorial() {
	const location = useLocation()
	const autoStartedRef = useRef(false)

	const startTutorial = useCallback(() => {
		const d = getDriver()
		if (d.isActive()) {
			d.destroy()
		}
		d.setSteps(getTutorialSteps(location.pathname))
		d.drive()
	}, [location.pathname])

	useEffect(() => {
		if (autoStartedRef.current) {
			return
		}
		autoStartedRef.current = true

		if (isTutorialSeen()) {
			return
		}
		// Tandai SEBELUM diputar supaya hanya muncul sekali,
		// walau user menutup di tengah tutorial.
		markTutorialSeen()

		// Tanpa cleanup: StrictMode double-mount di dev akan membatalkan
		// timer pertama, dan ref guard memblokir penjadwalan kedua.
		// Layout tidak pernah unmount selama app hidup, jadi ini aman.
		setTimeout(() => {
			startTutorial()
		}, 700)
	}, [startTutorial])

	return { startTutorial }
}

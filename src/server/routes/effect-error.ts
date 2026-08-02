/**
 * `Effect.runPromise` menolak dengan pembungkus `FiberFailure`
 * (bukan instance error asli), sehingga `instanceof` di route selalu gagal.
 * Helper ini mengembalikan error asli dari pembungkus tersebut.
 * `_id`/`cause` tidak bisa diakses langsung — hanya lewat `toJSON()`.
 */
export function unwrapEffectError(error: unknown): unknown {
	if (
		typeof error === "object" &&
		error !== null &&
		typeof (error as { toJSON?: unknown }).toJSON === "function"
	) {
		const json = (
			error as {
				toJSON: () => { _id?: string; cause?: { _tag?: string; failure?: unknown } }
			}
		).toJSON()
		if (json._id === "FiberFailure" && json.cause?._tag === "Fail") {
			return json.cause.failure
		}
	}
	return error
}

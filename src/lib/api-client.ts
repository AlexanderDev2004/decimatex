async function getApiBase(): Promise<string> {
	if (typeof window !== "undefined" && (window as unknown as { electronAPI?: { isElectron?: boolean; getServerPort?: () => Promise<number> } }).electronAPI?.isElectron) {
		const port = await (window as unknown as { electronAPI: { getServerPort: () => Promise<number> } }).electronAPI.getServerPort()
		return `http://localhost:${port}/api`
	}
	return "/api"
}

async function request<T>(
	path: string,
	options?: RequestInit,
): Promise<T> {
	const base = await getApiBase()
	const response = await fetch(`${base}${path}`, {
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		...options,
	})

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: "Unknown error" }))
		throw new Error(error.error || `HTTP ${response.status}`)
	}

	return response.json() as Promise<T>
}

export const apiClient = {
	get: <T>(path: string) => request<T>(path, { method: "GET" }),
	post: <T>(path: string, body: unknown) =>
		request<T>(path, { method: "POST", body: JSON.stringify(body) }),
	patch: <T>(path: string, body: unknown) =>
		request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
	delete: (path: string) => request<unknown>(path, { method: "DELETE" }),
}

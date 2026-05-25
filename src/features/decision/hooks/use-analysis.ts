import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { RankingResult } from "@/features/decision/lib/methods"

export interface AnalysisRun {
	id: string
	decisionId: string
	methodCode: string
	status: string
	createdAt: Date | string
	results?: Array<{
		alternativeId: string
		score: string
		rank: number
		alternative?: { name: string }
	}>
	method?: { name: string }
}

export const useRunAnalysis = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			decisionId,
			methodCode,
		}: {
			decisionId: string
			methodCode: string
		}) =>
			apiClient.post<{ run: AnalysisRun; ranking: RankingResult[] }>(
				"/analysis/run",
				{ decisionId, methodCode },
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["analysis", variables.decisionId],
			})
		},
	})
}

export const useAnalysisHistory = (decisionId: string | undefined) =>
	useQuery({
		queryKey: ["analysis", decisionId],
		queryFn: () =>
			apiClient.get<AnalysisRun[]>(`/analysis/history/${decisionId}`),
		enabled: !!decisionId,
	})

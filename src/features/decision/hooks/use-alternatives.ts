import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface AlternativeItem {
	id: string
	decisionId: string
	name: string
	description: string | null
	position: number
}

export const useAlternatives = (decisionId: string | undefined) =>
	useQuery({
		queryKey: ["decisions", decisionId, "alternatives"],
		queryFn: () =>
			apiClient.get<AlternativeItem[]>(
				`/decisions/${decisionId}/alternatives`,
			),
		enabled: !!decisionId,
	})

export const useCreateAlternative = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: {
			decisionId: string
			name: string
			description?: string
			position?: number
		}) =>
			apiClient.post<AlternativeItem>(
				`/decisions/${data.decisionId}/alternatives`,
				data,
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["decisions", variables.decisionId, "alternatives"],
			})
		},
	})
}

export const useUpdateAlternative = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			decisionId,
			alternativeId,
			data,
		}: {
			decisionId: string
			alternativeId: string
			data: Partial<{ name: string; description: string }>
		}) =>
			apiClient.patch<AlternativeItem>(
				`/decisions/${decisionId}/alternatives/${alternativeId}`,
				data,
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["decisions", variables.decisionId, "alternatives"],
			})
		},
	})
}

export const useDeleteAlternative = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			decisionId,
			alternativeId,
		}: {
			decisionId: string
			alternativeId: string
		}) =>
			apiClient.delete(
				`/decisions/${decisionId}/alternatives/${alternativeId}`,
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["decisions", variables.decisionId, "alternatives"],
			})
		},
	})
}

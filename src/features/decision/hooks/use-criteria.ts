import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface CriteriaItem {
	id: string
	decisionId: string
	name: string
	weight: string
	type: "benefit" | "cost"
	position: number
}

export const useCriteria = (decisionId: string | undefined) =>
	useQuery({
		queryKey: ["decisions", decisionId, "criteria"],
		queryFn: () =>
			apiClient.get<CriteriaItem[]>(`/decisions/${decisionId}/criteria`),
		enabled: !!decisionId,
	})

export const useCreateCriteria = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: {
			decisionId: string
			name: string
			type: "benefit" | "cost"
			weight: string
			position?: number
		}) => apiClient.post<CriteriaItem>(`/decisions/${data.decisionId}/criteria`, data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["decisions", variables.decisionId, "criteria"],
			})
		},
	})
}

export const useUpdateCriteriaWeight = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			decisionId,
			criteriaId,
			weight,
		}: {
			decisionId: string
			criteriaId: string
			weight: number
		}) =>
			apiClient.patch<CriteriaItem>(
				`/decisions/${decisionId}/criteria/${criteriaId}`,
				{ weight },
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["decisions", variables.decisionId, "criteria"],
			})
		},
	})
}

export const useDeleteCriteria = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			decisionId,
			criteriaId,
		}: {
			decisionId: string
			criteriaId: string
		}) => apiClient.delete(`/decisions/${decisionId}/criteria/${criteriaId}`),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["decisions", variables.decisionId, "criteria"],
			})
		},
	})
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface DecisionProblem {
	id: string
	name: string
	description: string | null
	createdAt: Date | string
}

export const useDecisions = () =>
	useQuery({
		queryKey: ["decisions"],
		queryFn: () => apiClient.get<DecisionProblem[]>("/decisions"),
	})

export const useCreateDecision = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: { name: string; description?: string }) =>
			apiClient.post<DecisionProblem>("/decisions", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["decisions"] })
		},
	})
}

export const useUpdateDecision = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string
			data: Partial<{ name: string; description: string }>
		}) => apiClient.patch<DecisionProblem>(`/decisions/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["decisions"] })
		},
	})
}

export const useDeleteDecision = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => apiClient.delete(`/decisions/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["decisions"] })
		},
	})
}

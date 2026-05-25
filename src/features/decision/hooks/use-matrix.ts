import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface MatrixItem {
	decisionId: string
	alternativeId: string
	criteriaId: string
	value: string
}

export const useMatrix = (decisionId: string | undefined) =>
	useQuery({
		queryKey: ["decisions", decisionId, "matrix"],
		queryFn: () =>
			apiClient.get<MatrixItem[]>(`/decisions/${decisionId}/matrix`),
		enabled: !!decisionId,
	})

export const useSaveMatrixValue = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: {
			decisionId: string
			alternativeId: string
			criteriaId: string
			value: string
		}) => apiClient.post<MatrixItem>(`/decisions/${data.decisionId}/matrix`, data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["decisions", variables.decisionId, "matrix"],
			})
		},
	})
}

export const useDeleteMatrixValue = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			decisionId,
			alternativeId,
			criteriaId,
		}: {
			decisionId: string
			alternativeId: string
			criteriaId: string
		}) =>
			apiClient.delete(
				`/decisions/${decisionId}/matrix/${alternativeId}/${criteriaId}`,
			),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["decisions", variables.decisionId, "matrix"],
			})
		},
	})
}

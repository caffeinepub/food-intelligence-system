import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FoodAnalysis, HistoryRecord } from "../backend";
import { useActor } from "./useActor";

export function useGetHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<HistoryRecord[]>({
    queryKey: ["history"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAnalyzeFood() {
  const { actor } = useActor();
  return useMutation<
    FoodAnalysis,
    Error,
    { imageSize: bigint; textQuery: string }
  >({
    mutationFn: async ({ imageSize, textQuery }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.analyzeFood(imageSize, textQuery);
    },
  });
}

export function useSaveAnalysis() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { foodName: string; freshnessLabel: string; confidencePercent: bigint }
  >({
    mutationFn: async ({ foodName, freshnessLabel, confidencePercent }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.saveAnalysis(
        foodName,
        freshnessLabel,
        confidencePercent,
        null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

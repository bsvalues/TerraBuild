import { useQuery } from "@tanstack/react-query";

export function useRepository() {
  const { data: repository, isLoading, error } = useQuery({
    queryKey: ["/api/repository"],
  });

  return {
    repository,
    isLoading,
    error,
    isComplete: repository?.status === "complete"
  };
}

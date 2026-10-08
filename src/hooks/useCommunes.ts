import { useQuery } from "@tanstack/react-query";

/** The commune table (~60 KB) is its own chunk — fetched the first time a
    checkout form renders, never on pages that have none. */
export function useCommunes() {
  return useQuery({
    queryKey: ["communes"],
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    queryFn: async () => (await import("@/data/communes")).COMMUNES,
  });
}

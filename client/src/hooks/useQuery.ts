import { useQuery as useReactQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';

/**
 * Wrapper around TanStack Query's useQuery with our conventions
 */
export function useQuery<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
) {
  return useReactQuery(options);
}

/**
 * Wrapper around TanStack Query's useMutation
 */
export function useMutationQuery<TData = unknown, TError = unknown, TVariables = void>(
  options: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation(options);
}

/**
 * Hook to get the query client (for invalidation, etc.)
 */
export { useQueryClient };

/**
 * Query keys factory for consistent cache management
 */
export const queryKeys = {
  // Auth & User
  me: ['me'] as const,
  meHistory: ['me', 'history'] as const,

  // Sessions - Participant
  nearbysessions: (lat: number, lng: number) => ['sessions', 'nearby', lat, lng] as const,
  session: (id: string) => ['sessions', id] as const,
  sessionRecords: (id: string) => ['sessions', id, 'records'] as const,

  // Sessions - Creator
  mySessions: ['sessions', 'mine'] as const,
  mySession: (id: string) => ['sessions', 'mine', id] as const,
};

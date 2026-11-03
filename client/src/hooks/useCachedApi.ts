import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meApi, sessionsApi } from '../api/endpoints';
import { queryKeys } from './useQuery';
import type { ApiError } from '../api/client';
import type { Fix, Status } from '../types';

/**
 * Cached hook for fetching current user data
 */
export function useMe() {
  return useQuery<any, ApiError>({
    queryKey: queryKeys.me,
    queryFn: () => meApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Cached hook for fetching user history
 */
export function useMeHistory() {
  return useQuery<any, ApiError>({
    queryKey: queryKeys.meHistory,
    queryFn: () => meApi.history(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Cached hook for fetching nearby sessions
 */
export function useNearbySessions(fix: Fix, enabled = true) {
  const { lat, lng } = fix;
  return useQuery<any, ApiError>({
    queryKey: queryKeys.nearbysessions(lat, lng),
    queryFn: () => sessionsApi.nearby(fix),
    staleTime: 30 * 1000, // 30 seconds (sessions change frequently)
    enabled,
  });
}

/**
 * Cached hook for fetching a single session
 */
export function useSession(id: string, fix: Fix, token?: string) {
  return useQuery<any, ApiError>({
    queryKey: queryKeys.session(id),
    queryFn: () => sessionsApi.detail(id, fix, token),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Cached hook for fetching session records (creator view)
 */
export function useSessionRecords(id: string) {
  return useQuery<any, ApiError>({
    queryKey: queryKeys.sessionRecords(id),
    queryFn: () => sessionsApi.records(id),
    staleTime: 10 * 1000, // 10 seconds (frequently updated)
  });
}

/**
 * Cached hook for fetching creator's sessions
 */
export function useMySessions(status?: Status) {
  return useQuery<any, ApiError>({
    queryKey: queryKeys.mySessions,
    queryFn: () => sessionsApi.listMine(status),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Cached hook for fetching creator's single session
 */
export function useMySession(id: string) {
  return useQuery<any, ApiError>({
    queryKey: queryKeys.mySession(id),
    queryFn: () => sessionsApi.getMine(id),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Mutation hook for updating user profile with automatic cache invalidation
 */
export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, any>({
    mutationFn: (data) => meApi.patch(data),
    onSuccess: (data) => {
      // Update the cache immediately with the new data
      queryClient.setQueryData(queryKeys.me, data);
    },
  });
}

/**
 * Mutation hook for check-in with automatic cache invalidation
 */
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, { sessionId: string; fix: Fix; extra: any }>({
    mutationFn: ({ sessionId, fix, extra }) => sessionsApi.checkIn(sessionId, fix, extra),
    onSuccess: (_, variables) => {
      // Invalidate session and history queries
      queryClient.invalidateQueries({ queryKey: queryKeys.session(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meHistory });
    },
  });
}

/**
 * Helper to invalidate all session-related queries (useful after creating/updating sessions)
 */
export function useInvalidateSessions() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    invalidateNearby: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'nearby'] });
    },
    invalidateMine: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mySessions });
    },
  };
}

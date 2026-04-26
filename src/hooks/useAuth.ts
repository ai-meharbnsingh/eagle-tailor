import { trpc, TOKEN_KEY } from "@/lib/trpc-client";
import { useCallback, useMemo } from "react";

export type AuthUser = {
  id: number;
  name: string;
  role: string;
} | null;

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      localStorage.removeItem(TOKEN_KEY);
      await utils.invalidate();
      window.location.reload();
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return useMemo(
    () => {
      const typedUser: AuthUser = user
        ? { id: user.id, name: user.name ?? "User", role: ("role" in user ? user.role : "user") as string }
        : null;
      return {
        user: typedUser,
        isAuthenticated: !!typedUser,
        isLoading: isLoading || logoutMutation.isPending,
        error,
        logout,
        refresh: refetch,
      };
    },
    [user, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}

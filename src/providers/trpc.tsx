import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import { useState, type ReactNode } from "react";
import { trpc, TOKEN_KEY } from "@/lib/trpc-client";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_BASE}/api/trpc`,
      transformer: superjson,
      headers() {
        const token = localStorage.getItem(TOKEN_KEY);
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

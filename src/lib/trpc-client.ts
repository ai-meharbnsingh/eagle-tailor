import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../api/router";

export const trpc = createTRPCReact<AppRouter>();
export const TOKEN_KEY = "et_pin_token";

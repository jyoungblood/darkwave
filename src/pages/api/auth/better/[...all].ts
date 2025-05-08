// DW - Auth - Better-auth handler

import { auth } from "@/lib/auth/better";
import type { APIRoute } from "astro";

export const ALL: APIRoute = async (ctx) => {
  return auth.handler(ctx.request);
}; 
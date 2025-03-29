import { createTRPCRouter } from "~/server/api/trpc";
import { watermarkRouter } from "~/server/api/routers/watermark";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  watermark: watermarkRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

# Vercel Deployment

To ensure the Express API routes (like KHQR payment generation) work on Vercel:

1. A `vercel.json` has been added which rewrites `/api/(.*)` to `api/index.ts`.
2. The API routes have been extracted to `api/index.ts` which exports the Express app.
3. Vercel will automatically host the `dist/` directory as static files and the `api/index.ts` as a serverless function.

No further configuration is required on Vercel!

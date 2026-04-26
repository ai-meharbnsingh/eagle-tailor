import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths, Session } from "@contracts/constants";
import { getPinCookieName } from "./pin-session";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

const app = new Hono<{ Bindings: HttpBindings }>();

const allowedOrigins = env.corsOrigins.length > 0
  ? env.corsOrigins
  : ["http://localhost:3000", "http://localhost:3002"];

app.use("/api/*", cors({
  origin: (origin) => allowedOrigins.includes(origin) ? origin : null,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  maxAge: 86400,
}));

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "bills");
const THUMBS_DIR = path.join(process.cwd(), "uploads", "thumbnails");

async function ensureDirs() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(THUMBS_DIR, { recursive: true });
}

await ensureDirs();

app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// File upload endpoint
app.post("/api/upload/bill", bodyLimit({ maxSize: 50 * 1024 * 1024 }), async (c) => {
  try {
    // Auth check: accept Authorization header (primary) or session cookie (fallback)
    const authHeader = c.req.header("authorization") || "";
    const cookieHeader = c.req.header("cookie") || "";
    const hasBearer = authHeader.startsWith("Bearer ");
    const hasPinSid = cookieHeader.includes(getPinCookieName());
    const hasKimiSid = cookieHeader.includes(Session.cookieName);
    if (!hasBearer && !hasPinSid && !hasKimiSid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return c.json({ error: "No image provided" }, 400);
    }
    if (!file.type.startsWith("image/")) {
      return c.json({ error: "File must be an image" }, 400);
    }
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "File too large (max 10MB)" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = uuidv4();
    const ext = "jpg";
    const filename = `${id}.${ext}`;
    const thumbFilename = `thumb_${id}.${ext}`;

    const imagePath = path.join(UPLOADS_DIR, filename);
    const thumbPath = path.join(THUMBS_DIR, thumbFilename);

    // Compress and save main image
    await sharp(buffer)
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toFile(imagePath);

    // Generate thumbnail
    await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 70, progressive: true })
      .toFile(thumbPath);

    const base = env.publicUrl;
    return c.json({
      success: true,
      imageUrl: `${base}/uploads/bills/${filename}`,
      thumbnailUrl: `${base}/uploads/thumbnails/${thumbFilename}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// Serve static uploads
app.use("/uploads/*", async (c) => {
  const uploadsRoot = path.resolve(path.join(process.cwd(), "uploads"));
  const requestedPath = path.normalize(c.req.path.replace(/^\/uploads\//, ""));
  const filePath = path.resolve(uploadsRoot, requestedPath);
  if (!filePath.startsWith(uploadsRoot)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error("Not a file");
    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".png"
          ? "image/png"
          : "application/octet-stream";
    return c.body(fileBuffer, 200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    });
  } catch {
    return c.json({ error: "File not found" }, 404);
  }
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  await ensureDirs();
  const server = serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close?.();
  });
  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    server.close?.();
  });
}

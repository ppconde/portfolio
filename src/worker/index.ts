import type { R2Bucket } from "@cloudflare/workers-types";
import { Hono } from "hono";

type Bindings = {
  PORTFOLIO_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("*", async (c) => {
  const key = c.req.path.substring(1);
  if (!key) return c.text("Bad Request", 400);

  const object = await c.env.PORTFOLIO_BUCKET.get(key);
  if (!object) return c.text("Not Found", 404);

  const headers: Record<string, string> = {};
  object.writeHttpMetadata(headers as any);
  headers["etag"] = object.httpEtag;
  headers["Cache-Control"] = "public, max-age=3600";

  return new Response(object.body as any, { headers });
});

export default app;

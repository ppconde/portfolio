import type { R2Bucket } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: { PORTFOLIO_BUCKET: R2Bucket } }>();

app.use(
	"*",
	cors({
		origin: (origin) => {
			const allowed = ["http://localhost:5173", "https://ppconde.com"];
			return allowed.includes(origin ?? "") ? origin : "";
		},
	}),
);

app.get("/models/:path{.+}", async (c) => {
	const key = c.req.param("path");
	const file = await c.env.PORTFOLIO_BUCKET.get(key);

	if (!file) {
		return c.text("Not found", 404);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <@todo Fix this later>
	return new Response(file.body as any, {
		headers: {
			"Content-Type": file.httpMetadata?.contentType || "application/octet-stream",
			"Cache-Control": "public, max-age=3600",
		},
	});
});

export default app;

import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*" }));

app.get("/models/:path{.+}", async (c) => {
	const file = await c.env.PORTFOLIO_BUCKET.get(`models/${c.req.param("path")}`);

	if (!file) {
		return c.text("File not found on bucket", 404);
	}

	const headers = new Headers();
	file.writeHttpMetadata(headers);
	headers.set("Cache-Control", "public, max-age=31536000, immutable");
	return new Response(file.body, { headers });
});

export default app;

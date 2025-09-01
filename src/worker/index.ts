import type { R2Bucket } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: { PORTFOLIO_BUCKET: R2Bucket } }>();

// Enable CORS for dev + prod
app.use(
	"*",
	cors({
		origin: (origin) => {
			const allowed = [
				/^http:\/\/localhost:5173$/, // local dev
				/^https:\/\/ppconde\.com$/, // main domain
				/^https:\/\/(?:[a-z0-9-]+-)?portfolio\.pepconde-1993\.workers\.dev$/, // any subdomain ending in -portfolio
			];
			return allowed.some((regex) => regex.test(origin)) ? origin : "";
		},
	}),
);

app.get("/models/:path{.+}", async (c) => {
	const key = `models/${c.req.param("path")}`;
	const file = await c.env.PORTFOLIO_BUCKET.get(key);

	if (!file) {
		return c.text("Not found", 404);
	}

	const contentType =
		file.httpMetadata?.contentType ||
		(key.endsWith(".glb")
			? "model/gltf-binary"
			: key.endsWith(".gltf")
				? "model/gltf+json"
				: "application/octet-stream");

	// biome-ignore lint/suspicious/noExplicitAny: <@todo fix later>
	return new Response(file.body as any, {
		headers: {
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
});

export default app;

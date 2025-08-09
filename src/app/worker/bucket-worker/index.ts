/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { authorizeRequest } from "./authorize";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		// Trim trailing slash
		const key = url.pathname.slice(1).replace(/\/$/, "");

		if (!authorizeRequest(request, key)) {
			return new Response("Forbidden", { status: 403 });
		}

		switch (request.method) {
			case "GET": {
				const object = await env.PORTFOLIO_BUCKET.get(key);

				if (object === null) {
					return new Response("Object Not Found", { status: 404 });
				}

				const headers = new Headers();
				if (env.ENVIRONMENT === "development" || env.ENVIRONMENT === "production") {
					headers.append("Access-Control-Allow-Origin", "*");
				}
				object.writeHttpMetadata(headers);
				headers.set("etag", object.httpEtag);

				return new Response(object.body, {
					headers,
				});
			}
			default:
				return new Response("Method Not Allowed", {
					status: 405,
					headers: {
						Allow: "GET",
					},
				});
		}
	},
} satisfies ExportedHandler<Env>;

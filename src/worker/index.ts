export default {
	async fetch(request, env) {
		const { pathname } = new URL(request.url);
		const file = pathname.startsWith("/models/") ? await env.PORTFOLIO_BUCKET.get(pathname.slice(1)) : null;

		if (!file) {
			return new Response("File not found on bucket", { status: 404 });
		}

		const headers = new Headers();
		file.writeHttpMetadata(headers);
		headers.set("Cache-Control", "public, max-age=31536000, immutable");
		return new Response(file.body, { headers });
	},
} satisfies ExportedHandler<Env>;

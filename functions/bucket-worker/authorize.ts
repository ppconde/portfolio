const ALLOW_LIST = [".glb", ".jpg", ".jpeg", ".png", ".gltf", ".bin"];

export function authorizeRequest(request: Request, key: string): boolean {
	return request.method === "GET" && ALLOW_LIST.some((ext) => new RegExp(`${ext}`, "i").test(key));
}

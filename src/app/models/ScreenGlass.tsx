import { ShaderMaterial } from "three";

// CRT glass laid over the screen iframe. The iframe sits under the canvas (drei <Html occlude="blending">), so this
// transparent mesh is composited on top of the live page: a slight bulge, dark rounded corners, a fresnel rim,
// a soft highlight that shifts with the view, and faint scanlines.
const BULGE = 0.006; // metres at the centre
// The monitor glass in pc.glb, which the iframe also matches: 0.248 x 0.166 m, centred at (0, 0.318), front z ≈ 0.108.
const W = 0.248;
const H = 0.166;

const material = new ShaderMaterial({
	transparent: true,
	depthWrite: false,
	uniforms: { uBulge: { value: BULGE } },
	vertexShader: /* glsl */ `
		uniform float uBulge;
		varying vec2 vUv;
		varying vec3 vNormal;
		varying vec3 vView;
		void main() {
			vUv = uv;
			vec2 p = uv * 2.0 - 1.0;
			vec3 pos = position;
			pos.z += uBulge * (1.0 - p.x * p.x) * (1.0 - p.y * p.y);
			// slope of the bulge in object space (plane spans the geometry's width/height in metres)
			vec2 size = vec2(${W}, ${H});
			float dzdx = uBulge * -2.0 * p.x * (1.0 - p.y * p.y) * 2.0 / size.x;
			float dzdy = uBulge * -2.0 * p.y * (1.0 - p.x * p.x) * 2.0 / size.y;
			vNormal = normalize(normalMatrix * vec3(-dzdx, -dzdy, 1.0));
			vec4 mv = modelViewMatrix * vec4(pos, 1.0);
			vView = normalize(-mv.xyz);
			gl_Position = projectionMatrix * mv;
		}
	`,
	fragmentShader: /* glsl */ `
		varying vec2 vUv;
		varying vec3 vNormal;
		varying vec3 vView;
		void main() {
			vec2 q = abs(vUv * 2.0 - 1.0);
			// superellipse vignette: darkens towards the edges and rounds the corners like a CRT tube
			float edge = pow(q.x, 16.0) + pow(q.y, 16.0);
			float vignette = smoothstep(0.45, 1.1, edge) * 0.7;

			float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 3.0) * 0.6;

			// soft window reflection, top-left, drifting with the view direction
			vec2 h = (vUv - vec2(0.3, 0.75) - vView.xy * 0.2) * vec2(1.0, 1.6);
			float highlight = exp(-dot(h, h) * 10.0) * 0.2;
			// glare: a soft diagonal streak across the upper half, sliding with the view
			float band = vUv.x * 0.7 + vUv.y - 0.9 - vView.x * 0.3;
			float glare = (exp(-band * band * 200.0) * 0.16 + exp(-pow(band + 0.1, 2.0) * 900.0) * 0.1) * smoothstep(0.15, 0.6, vUv.y);
			float sheen = smoothstep(0.1, 0.9, vUv.y - vUv.x * 0.5) * 0.08;

			// scanlines, faded out once they get thinner than a pixel
			float lines = 0.5 + 0.5 * sin(vUv.y * 400.0 * 3.14159);
			float scan = lines * 0.06 * (1.0 - smoothstep(0.3, 0.7, fwidth(vUv.y * 400.0)));

			float light = fresnel + highlight + sheen + glare;
			float alpha = clamp(0.03 + vignette + scan + light, 0.0, 1.0);
			vec3 colour = (vec3(0.02, 0.035, 0.03) * (0.03 + vignette + scan) + vec3(0.88, 0.96, 1.0) * light) / max(alpha, 1e-4);
			gl_FragColor = vec4(colour, alpha);
		}
	`,
});

// Same size and place as the iframe (see Experience.tsx), just in front of it.
export function ScreenGlass() {
	return (
		<mesh position={[0, 0.318, 0.1085]} material={material}>
			<planeGeometry args={[W, H, 32, 24]} />
		</mesh>
	);
}

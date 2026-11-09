import { Edges, Outlines, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { DataTexture, type Mesh, type MeshStandardMaterial, MeshToonMaterial, RedFormat } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

// One mesh per material, exported from Blender (metres, origin at the bottom centre of the base, screen facing +z).
const MESHES = [
	"Plastic",
	"DarkPlastic",
	"Rubber",
	"KeyLight",
	"KeyGray",
	"KeyRed",
	"KeyOrange",
	"LED",
	"Screw",
	"Screen",
] as const;

type GLTFResult = GLTF & { nodes: Record<(typeof MESHES)[number], Mesh> };

// Served by this app's own worker (src/worker/index.ts) from R2. Draco-compressed; drei's useGLTF decodes it.
const MODEL_URL = "/models/pc.glb";

// Cel shading: three light bands (shadow, mid, lit). DataTexture defaults to nearest filtering, so the bands stay hard.
const toonRamp = new DataTexture(new Uint8Array([110, 185, 255]), 3, 1, RedFormat);
toonRamp.needsUpdate = true;

// Ink lines. In drei 10's non-screenspace mode `thickness` is in pixels, so the line width stays constant at any zoom.
const INK = { color: "#1c1c1c", thickness: 2.5 };
// Inner fold lines: edges sharper than this many degrees. The Blender bevels split each 90° edge into ~30° steps.
const FOLD_ANGLE = 25;

// Illustration grain, injected into the toon shader: soft grime blotches in object space (model is in metres),
// plus fixed per-pixel paper speckle in screen space.
const GRAIN_PARS = /* glsl */ `
varying vec3 vObjPos;
float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float valueNoise(vec3 p) {
	vec3 i = floor(p);
	vec3 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
		mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
		f.z);
}
`;

function addGrain(material: MeshToonMaterial) {
	material.onBeforeCompile = (shader) => {
		shader.vertexShader = shader.vertexShader
			.replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;")
			.replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
		shader.fragmentShader = shader.fragmentShader
			.replace("#include <common>", `#include <common>\n${GRAIN_PARS}`)
			.replace(
				"#include <color_fragment>",
				`#include <color_fragment>
				float grime = valueNoise(vObjPos * 60.0) * 0.6 + valueNoise(vObjPos * 220.0) * 0.4;
				float speck = hash12(floor(gl_FragCoord.xy));
				diffuseColor.rgb *= 1.0 - 0.1 * grime - 0.07 * speck;`,
			);
	};
	material.customProgramCacheKey = () => "toon-grain";
	return material;
}

export function Computer() {
	const { nodes } = useGLTF(MODEL_URL) as unknown as GLTFResult;

	// Swap the exported PBR materials for toon ones, keeping their colours (and the LED's glow).
	const materials = useMemo(
		() =>
			Object.fromEntries(
				MESHES.map((name) => {
					const source = nodes[name].material as MeshStandardMaterial;
					return [
						name,
						addGrain(
							new MeshToonMaterial({
								color: source.color,
								emissive: source.emissive,
								emissiveIntensity: source.emissiveIntensity,
								gradientMap: toonRamp,
							}),
						),
					];
				}),
			) as Record<(typeof MESHES)[number], MeshToonMaterial>,
		[nodes],
	);

	return (
		<group dispose={null}>
			{MESHES.map((name) => (
				<mesh
					key={name}
					name={name}
					castShadow
					receiveShadow
					geometry={nodes[name].geometry}
					material={materials[name]}
				>
					<Outlines {...INK} />
					<Edges threshold={FOLD_ANGLE} color={INK.color} lineWidth={1} />
				</mesh>
			))}
		</group>
	);
}

useGLTF.preload(MODEL_URL);

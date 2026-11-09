import { Outlines, useGLTF } from "@react-three/drei";
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

// Ink line width in world units (the model is in metres): ~1.5 mm reads as a ~2px line at the default framing.
const INK = { color: "#1c1c1c", thickness: 0.0015 };

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
						new MeshToonMaterial({
							color: source.color,
							emissive: source.emissive,
							emissiveIntensity: source.emissiveIntensity,
							gradientMap: toonRamp,
						}),
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
				</mesh>
			))}
		</group>
	);
}

useGLTF.preload(MODEL_URL);

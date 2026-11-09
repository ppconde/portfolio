import { useGLTF } from "@react-three/drei";
import type * as THREE from "three";
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

type GLTFResult = GLTF & { nodes: Record<(typeof MESHES)[number], THREE.Mesh> };

// Served by this app's own worker (src/worker/index.ts) from R2. Draco-compressed; drei's useGLTF decodes it.
const MODEL_URL = "/models/pc.glb";

export function Computer() {
	const { nodes } = useGLTF(MODEL_URL) as unknown as GLTFResult;
	return (
		<group dispose={null}>
			{MESHES.map((name) => (
				<mesh
					key={name}
					name={name}
					castShadow
					receiveShadow
					geometry={nodes[name].geometry}
					material={nodes[name].material}
				/>
			))}
		</group>
	);
}

useGLTF.preload(MODEL_URL);

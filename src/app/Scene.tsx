import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { Zoom } from "./App";
import { Experience } from "./Experience";
import { Loader } from "./Loader";

// Hoisted: App re-renders on every zoom change, and fresh objects here would make R3F reconfigure the renderer.
// Starts just behind and above the wide shot so the intro glide stays inside the fog (far = 3.2 m) instead of out in the black.
const CAMERA = { fov: 45, near: 0.1, far: 200, position: [0.7, 0.85, 2] as [number, number, number] };
const GL = { antialias: true, toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace };

export function Scene({ zoom }: { zoom: Zoom }) {
	return (
		<>
			{/* a click or tap that hits nothing interactive (the room around the PC) zooms back out */}
			<Canvas camera={CAMERA} gl={GL} shadows="percentage" onPointerMissed={zoom.leave}>
				<Experience zoom={zoom} />
			</Canvas>
			<Loader />
		</>
	);
}

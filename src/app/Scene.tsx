import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { Zoom } from "./App";
import { Experience } from "./Experience";
import { Loader } from "./Loader";

// Hoisted: App re-renders on every zoom change, and fresh objects here would make R3F reconfigure the renderer.
const CAMERA = { fov: 45, near: 0.1, far: 200, position: [3, 1, 5] as [number, number, number] };
const GL = { antialias: true, toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace };

export function Scene({ zoom }: { zoom: Zoom }) {
	return (
		<>
			{/* a click or tap that hits nothing interactive (the room around the PC) zooms back out */}
			<Canvas camera={CAMERA} gl={GL} shadows onPointerMissed={zoom.leave}>
				<Experience zoom={zoom} />
			</Canvas>
			<Loader />
		</>
	);
}

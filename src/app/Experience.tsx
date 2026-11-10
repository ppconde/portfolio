import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { lazy, Suspense, useMemo, useRef } from "react";
import { type Fog, type PerspectiveCamera, Vector3 } from "three";
import type { Zoom } from "./App";
import { Computer } from "./models/Computer";
import { Room } from "./models/Room";
import { ScreenGlass } from "./models/ScreenGlass";

// PC sits on the desk (y = 0) slightly back from centre; its screen centre in world space follows from pc.glb.
const PC_POS: [number, number, number] = [0, 0, -0.12];
const SCREEN = new Vector3(0, 0.318, 0.108 - 0.12);

const WIDE = { position: new Vector3(0.36, 0.6, 1.32), target: new Vector3(-0.08, 0.4, -0.25) };
const FOG = [1.2, 3.2];

// Profiler overlay, only fetched with ?perf in the URL.
const Perf = lazy(() => import("r3f-perf").then((m) => ({ default: m.Perf })));
const showPerf = new URLSearchParams(window.location.search).has("perf");

function CameraRig({ zoomed }: { zoomed: boolean }) {
	const target = useRef(WIDE.target.clone());
	const goal = new Vector3();
	const still = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
	useFrame(({ camera, pointer, size, scene }, delta) => {
		const aspect = size.width / size.height;
		const tan = Math.tan(((camera as PerspectiveCamera).fov * Math.PI) / 360);
		if (zoomed) {
			// fit the screen plus some bezel in both directions; on desktop that's the original 0.32 m framing
			const distance = Math.max(0.32, (0.248 * 1.15) / 2 / (tan * aspect), (0.166 * 1.3) / 2 / tan);
			goal.set(SCREEN.x, SCREEN.y, SCREEN.z + distance);
		} else {
			// narrow viewports back off along the shot line (and push the fog with it) so the desk still fits
			const back = Math.min(Math.max(1.6 / aspect, 1), 1.9);
			goal.copy(WIDE.position).sub(WIDE.target).multiplyScalar(back).add(WIDE.target);
			if (!still) goal.set(goal.x + pointer.x * 0.12, goal.y + pointer.y * 0.06, goal.z);
			const fog = scene.fog as Fog;
			fog.near = FOG[0] * back;
			fog.far = FOG[1] * back;
		}
		const k = still ? 1 : 1 - Math.exp(-delta * 3);
		camera.position.lerp(goal, k);
		target.current.lerp(zoomed ? SCREEN : WIDE.target, k);
		camera.lookAt(target.current);
	});
	return null;
}

// Zoom state lives in App (the DOM button drives it too). The iframe swallows pointer events, so hovering the screen
// and hovering the PC model are tracked separately.
export function Experience({ zoom: { zoomed, setPinned, setOverScreen, setOverPc } }: { zoom: Zoom }) {
	// ponytail: drei's <Html> picks its DOM target on render and, if it changes, unmounts and recreates its React root on
	// the same element; under R3F 9.8 + React 19.3 the late unmount wipes the iframe. Mount it only once R3F's events are
	// connected so the target never changes. Drop this guard once drei defers that unmount (pmndrs/drei#2867).
	const eventsConnected = useThree((state) => state.events.connected);

	return (
		<>
			{showPerf ? (
				<Suspense fallback={null}>
					<Perf position="top-left" />
				</Suspense>
			) : null}
			{/* Night mood: the room is mostly dark green-black, lit by the screen, the desk lamp and a red neon spill. */}
			<color attach="background" args={["#050806"]} />
			<fog attach="fog" args={["#050806", ...FOG]} />
			<CameraRig zoomed={zoomed} />
			<ambientLight color="#2c4a3c" intensity={0.1} />
			{/* faint cool fill from outside, still casting the desk shadows */}
			<directionalLight
				castShadow
				color="#7fa8a0"
				position={[-1.2, 2, 1.6]}
				intensity={0.18}
				shadow-normalBias={0.04}
				shadow-mapSize={[2048, 2048]}
			/>
			{/* screen glow, cyan-green like the lit shop window in the reference */}
			<pointLight position={[0, 0.22, 0.35]} color="#9df5d6" intensity={0.65} distance={1.1} decay={1.6} />
			{/* red neon spill from the upper right */}
			<pointLight position={[0.75, 0.85, 0.1]} color="#ff2a1a" intensity={0.8} distance={1.8} decay={1.4} />
			<Suspense fallback={null}>
				<Room />
			</Suspense>
			{/* desk lamp bulb, from room.glb */}
			<pointLight position={[-0.47, 0.37, -0.35]} color="#ffb35a" intensity={1.5} distance={1.2} decay={1.6} />
			<group position={PC_POS}>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: a three.js group, not DOM; keyboard users zoom by tabbing into the screen */}
				<group
					onPointerOver={() => setOverPc(true)}
					onPointerOut={() => setOverPc(false)}
					// touch has no hover: a tap pins the zoom until a tap on the room or Escape
					onClick={(event) => event.nativeEvent.pointerType !== "mouse" && setPinned(true)}
				>
					<Suspense fallback={null}>
						<Computer />
					</Suspense>
					<ScreenGlass />
				</group>
				{eventsConnected ? (
					<Html transform occlude="blending" position={[0, 0.318, 0.108]} scale={0.248 / 30}>
						<div onPointerEnter={() => setOverScreen(true)} onPointerLeave={() => setOverScreen(false)}>
							<iframe
								src="https://os.ppconde.com"
								width={1200}
								height={800}
								title="Personal OS"
								// keyboard: tabbing into the page on the screen zooms in
								onFocus={() => setPinned(true)}
								style={{ border: "none", display: "block" }}
							/>
						</div>
					</Html>
				) : null}
			</group>
		</>
	);
}

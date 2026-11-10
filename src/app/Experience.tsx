import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { Perf } from "r3f-perf";
import { Suspense, useRef, useState } from "react";
import { Vector3 } from "three";
import { Computer } from "./models/Computer";
import { Room } from "./models/Room";
import { ScreenGlass } from "./models/ScreenGlass";

// PC sits on the desk (y = 0) slightly back from centre; its screen centre in world space follows from pc.glb.
const PC_POS: [number, number, number] = [0, 0, -0.12];
const SCREEN = new Vector3(0, 0.318, 0.108 - 0.12);

const WIDE = { position: new Vector3(0.36, 0.6, 1.32), target: new Vector3(-0.08, 0.4, -0.25) };
// Close enough that the 3:2 screen fills most of the view but the bezel and a sliver of room stay visible.
const ZOOM = { position: new Vector3(0, SCREEN.y, SCREEN.z + 0.32), target: SCREEN };

function CameraRig({ zoomed }: { zoomed: boolean }) {
	const target = useRef(WIDE.target.clone());
	const goal = new Vector3();
	useFrame(({ camera, pointer }, delta) => {
		const shot = zoomed ? ZOOM : WIDE;
		const k = 1 - Math.exp(-delta * 3);
		// small parallax in the wide shot only
		goal.copy(shot.position);
		if (!zoomed) goal.set(goal.x + pointer.x * 0.12, goal.y + pointer.y * 0.06, goal.z);
		camera.position.lerp(goal, k);
		target.current.lerp(shot.target, k);
		camera.lookAt(target.current);
	});
	return null;
}

export function Experience() {
	const { perfVisible } = useControls("Perf", { perfVisible: false });
	// Zoomed while the pointer is on the screen (DOM iframe) or anywhere on the PC model; back out once it's on neither.
	// The iframe swallows pointer events, so the two are tracked separately.
	const [overScreen, setOverScreen] = useState(false);
	const [overPc, setOverPc] = useState(false);
	const zoomed = overScreen || overPc;

	// ponytail: drei's <Html> picks its DOM target on render and, if it changes, unmounts and recreates its React root on
	// the same element; under R3F 9.8 + React 19.3 the late unmount wipes the iframe. Mount it only once R3F's events are
	// connected so the target never changes. Drop this guard once drei defers that unmount (pmndrs/drei#2867).
	const eventsConnected = useThree((state) => state.events.connected);

	return (
		<>
			{perfVisible ? <Perf position="top-left" /> : null}
			{/* Night mood: the room is mostly dark green-black, lit by the screen, the desk lamp and a red neon spill. */}
			<color attach="background" args={["#050806"]} />
			<fog attach="fog" args={["#050806", 1.2, 3.2]} />
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
				<group onPointerOver={() => setOverPc(true)} onPointerOut={() => setOverPc(false)}>
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
								style={{ border: "none", display: "block" }}
							/>
						</div>
					</Html>
				) : null}
			</group>
		</>
	);
}

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { Perf } from "r3f-perf";
import { Suspense, useRef, useState } from "react";
import { Vector3 } from "three";
import { Computer } from "./models/Computer";
import { Room } from "./models/Room";

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
	const [zoomed, setZoomed] = useState(false);

	// ponytail: drei's <Html> picks its DOM target on render and, if it changes, unmounts and recreates its React root on
	// the same element; under R3F 9.8 + React 19.3 the late unmount wipes the iframe. Mount it only once R3F's events are
	// connected so the target never changes. Drop this guard once drei defers that unmount (pmndrs/drei#2867).
	const eventsConnected = useThree((state) => state.events.connected);

	return (
		<>
			{perfVisible ? <Perf position="top-left" /> : null}
			<color attach="background" args={["#141714"]} />
			<CameraRig zoomed={zoomed} />
			<ambientLight intensity={0.55} />
			<directionalLight
				castShadow
				position={[-1.2, 2, 1.6]}
				intensity={2.2}
				shadow-normalBias={0.04}
				shadow-mapSize={[2048, 2048]}
			/>
			<Suspense fallback={null}>
				<Room />
			</Suspense>
			{/* desk lamp bulb, from room.glb */}
			<pointLight position={[-0.47, 0.37, -0.35]} color="#ffcf87" intensity={1.2} distance={1.6} decay={1.5} />
			<group position={PC_POS}>
				<Suspense fallback={null}>
					<Computer />
				</Suspense>
				{eventsConnected ? (
					<Html transform position={[0, 0.318, 0.108]} scale={0.248 / 30}>
						{/* Hover the screen to zoom in; leaving it (onto the room around it) zooms back out. */}
						<div onPointerEnter={() => setZoomed(true)} onPointerLeave={() => setZoomed(false)}>
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

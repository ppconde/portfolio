import { Html } from "@react-three/drei";
import { useControls } from "leva";
import { Perf } from "r3f-perf";
import { Suspense } from "react";
import { DoubleSide } from "three";
import { Loader } from "./Loader";
import { Computer } from "./models/Computer";

export function Experience() {
	const {
		positionX: pcPositionX,
		positionY: pcPositionY,
		positionZ: pcPositionZ,
		rotationX: pcRotationX,
		rotationY: pcRotationY,
		rotationZ: pcRotationZ,
	} = useControls("Pc", {
		positionX: { value: 2.7, min: -10, max: 10, step: 0.1 },
		positionY: { value: 0.9, min: -10, max: 10, step: 0.1 },
		positionZ: { value: 4.4, min: -10, max: 10, step: 0.1 },
		rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
		rotationY: { value: 0.5, min: -Math.PI, max: Math.PI, step: 0.01 },
		rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
	});

	// ponytail: starting values, tune in the "Screen" panel until the iframe sits on the model's screen
	const {
		positionX: screenPositionX,
		positionY: screenPositionY,
		positionZ: screenPositionZ,
		scale: screenScale,
	} = useControls("Screen", {
		positionX: { value: 0, min: -2, max: 2, step: 0.01 },
		positionY: { value: 0.3, min: -2, max: 2, step: 0.01 },
		positionZ: { value: 0.3, min: -2, max: 2, step: 0.01 },
		scale: { value: 0.05, min: 0.001, max: 1, step: 0.001 },
	});

	const { perfVisible } = useControls("Perf", { perfVisible: false });

	return (
		<>
			{perfVisible ? <Perf position="top-left" /> : null}
			<ambientLight intensity={1.5} />
			<directionalLight castShadow position={[1, 2, 3]} intensity={24.5} shadow-normalBias={0.04} />
			<group position={[pcPositionX, pcPositionY, pcPositionZ]} rotation={[pcRotationX, pcRotationY, pcRotationZ]}>
				<Suspense fallback={<Loader />}>
					<Computer />
				</Suspense>
				<Html transform position={[screenPositionX, screenPositionY, screenPositionZ]} scale={screenScale}>
					<iframe
						src="https://os.ppconde.com"
						width={800}
						height={600}
						title="Personal OS"
						style={{ border: "none" }}
					/>
				</Html>
			</group>
			<mesh rotation-x={-Math.PI * 0.5} position-y={-2} scale={10} receiveShadow>
				<planeGeometry />
				<meshStandardMaterial color={"#f7faff"} side={DoubleSide} />
			</mesh>
		</>
	);
}

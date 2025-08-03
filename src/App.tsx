import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import styles from "./App.module.css";
import { Experience } from "./Experience";
import { Loader } from "./Loader";

export function App() {
	const [screenPos, setScreenPos] = useState({ x: -9999, y: -9999 });

	return (
		<div className={styles.container}>
			<Canvas
				camera={{
					fov: 45,
					near: 0.1,
					far: 200,
					position: [3, 1, 5],
				}}
				gl={{
					antialias: true,
					toneMapping: ACESFilmicToneMapping,
					outputColorSpace: SRGBColorSpace,
				}}
				shadows
			>
				<Suspense fallback={<Loader />}>
					<Experience onScreenPositionChange={setScreenPos} />
				</Suspense>
			</Canvas>

			{/* Position the iframe absolutely over the 3D screen */}
			<iframe
				src="https://os.ppconde.com"
				width={800}
				height={600}
				title="Personal OS"
				style={{
					position: "absolute",
					left: screenPos.x - 490, // Adjust offsets based on model's screen size
					top: screenPos.y - 230,
					pointerEvents: "auto",
					border: "none",
					// transform: "scale(0.9)",
					transformOrigin: "center",
				}}
			/>
		</div>
	);
}

import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import styles from "./App.module.css";
import { Experience } from "./Experience";

export function App() {
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
				<Experience />
			</Canvas>
		</div>
	);
}

import { useProgress } from "@react-three/drei";
import styles from "./App.module.css";

// Plain DOM overlay, rendered outside the <Canvas>. A drei <Html> here (as a Suspense fallback) creates its own React
// root that gets unmounted mid-commit when the model resolves, which throws "removeChild ... not a child of this node".
export function Loader() {
	const { active, progress } = useProgress();
	return active ? <div className={styles.loader}>Loading the room · {Math.round(progress)}%</div> : null;
}

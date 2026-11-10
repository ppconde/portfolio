import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import styles from "./App.module.css";

// three.js, drei and the models live in their own chunk; this shell paints first.
const Scene = lazy(() => import("./Scene").then((m) => ({ default: m.Scene })));

export type Zoom = {
	zoomed: boolean;
	setPinned: (on: boolean) => void;
	setOverScreen: (on: boolean) => void;
	setOverPc: (on: boolean) => void;
	leave: () => void;
};

export function App() {
	// Zoomed while hovering the PC or its screen (mouse), or while pinned by a tap on the PC or keyboard focus on the
	// screen. A tap on the room around it, or Escape, zooms back out.
	const [pinned, setPinned] = useState(false);
	const [overScreen, setOverScreen] = useState(false);
	const [overPc, setOverPc] = useState(false);
	const zoomed = pinned || overScreen || overPc;
	const leave = useCallback(() => {
		setPinned(false);
		setOverScreen(false);
		setOverPc(false);
	}, []);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && leave();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [leave]);

	return (
		<main className={styles.container}>
			<h1 className={styles.visuallyHidden}>Pedro Conde, software engineer</h1>
			<p className={styles.visuallyHidden}>
				A late-night desk corner: posters on the wall, a lamp, comics, a walkman, and a retro PC whose screen runs my
				portfolio.
			</p>
			<Suspense fallback={<div className={styles.loader}>Loading the room</div>}>
				<Scene zoom={{ zoomed, setPinned, setOverScreen, setOverPc, leave }} />
			</Suspense>
		</main>
	);
}

import { Edges, Outlines, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { CanvasTexture, type Mesh, type MeshStandardMaterial, MeshToonMaterial, SRGBColorSpace } from "three";
import { addGrain, INK, toonRamp } from "./Computer";

// The desk corner around the PC, built by ~/Documents/models/room/build_room.py: one mesh per material, transforms
// already applied (desk top at y = 0). Poster_* and Comic_* keep 0-1 UVs; their art is drawn below on canvases.
// Served by this app's own worker (src/worker/index.ts) from R2, like pc.glb.
const MODEL_URL = "/models/room.glb";

const C = { red: "#c23b2b", black: "#1c1c1c", paper: "#efe8d6" };

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
	draw(ctx);
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = 8;
	// glTF UVs have their origin top-left
	texture.flipY = false;
	return texture;
}

function halftone(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, step = 10, max = 2.4) {
	ctx.fillStyle = color;
	for (let y = 0; y < h; y += step)
		for (let x = (y / step) % 2 ? step / 2 : 0; x < w; x += step) {
			const r = max * (y / h);
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
}

// MF DOOM: masked figure with a mic, red and black on cream.
function doomPoster() {
	return canvasTexture(720, 1000, (ctx) => {
		ctx.fillStyle = C.paper;
		ctx.fillRect(0, 0, 720, 1000);
		ctx.fillStyle = C.red;
		ctx.fillRect(40, 40, 640, 700);
		halftone(ctx, 720, 740, "rgba(0,0,0,0.25)");
		ctx.fillStyle = C.paper;
		ctx.fillRect(0, 740, 720, 260);
		// shoulders (cardigan)
		ctx.fillStyle = C.black;
		ctx.beginPath();
		ctx.moveTo(110, 740);
		ctx.quadraticCurveTo(140, 560, 360, 545);
		ctx.quadraticCurveTo(580, 560, 610, 740);
		ctx.fill();
		// hood / beanie
		ctx.beginPath();
		ctx.ellipse(360, 360, 150, 190, 0, 0, Math.PI * 2);
		ctx.fill();
		// mask
		ctx.fillStyle = "#b9b4a8";
		ctx.beginPath();
		ctx.moveTo(360, 215);
		ctx.lineTo(470, 300);
		ctx.lineTo(470, 400);
		ctx.lineTo(420, 410);
		ctx.lineTo(420, 520);
		ctx.lineTo(395, 520);
		ctx.lineTo(385, 420);
		ctx.lineTo(335, 420);
		ctx.lineTo(325, 520);
		ctx.lineTo(300, 520);
		ctx.lineTo(300, 410);
		ctx.lineTo(250, 400);
		ctx.lineTo(250, 300);
		ctx.closePath();
		ctx.fill();
		ctx.lineWidth = 6;
		ctx.strokeStyle = C.black;
		ctx.stroke();
		// eye slits
		ctx.fillStyle = C.black;
		ctx.fillRect(275, 320, 70, 22);
		ctx.fillRect(375, 320, 70, 22);
		// mouth
		ctx.fillRect(335, 445, 50, 14);
		// mic
		ctx.save();
		ctx.translate(560, 470);
		ctx.rotate(0.25);
		ctx.fillRect(-18, -40, 36, 190);
		ctx.beginPath();
		ctx.arc(0, -50, 30, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
		// title
		ctx.fillStyle = C.black;
		ctx.font = "900 190px Impact, 'Arial Narrow', sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("MF DOOM", 360, 935);
	});
}

// Massive Attack: a stag beetle in black ink, lots of white space.
function beetlePoster() {
	return canvasTexture(720, 1000, (ctx) => {
		ctx.fillStyle = "#f4f1ea";
		ctx.fillRect(0, 0, 720, 1000);
		ctx.strokeStyle = C.black;
		ctx.fillStyle = C.black;
		ctx.lineCap = "round";
		ctx.lineWidth = 7;
		// legs
		for (const [y, dx, dy] of [
			[430, 150, -40],
			[500, 170, 20],
			[570, 150, 90],
		]) {
			for (const s of [-1, 1]) {
				ctx.beginPath();
				ctx.moveTo(360, y);
				ctx.lineTo(360 + s * dx * 0.7, y + dy * 0.4);
				ctx.lineTo(360 + s * dx, y + dy);
				ctx.stroke();
			}
		}
		// mandibles
		for (const s of [-1, 1]) {
			ctx.beginPath();
			ctx.moveTo(360 + s * 30, 320);
			ctx.bezierCurveTo(360 + s * 120, 260, 360 + s * 90, 170, 360 + s * 20, 150);
			ctx.lineWidth = 16;
			ctx.stroke();
		}
		// head, thorax, abdomen
		ctx.beginPath();
		ctx.ellipse(360, 340, 75, 45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(360, 420, 85, 45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(360, 560, 95, 130, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = "#f4f1ea";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(360, 440);
		ctx.lineTo(360, 685);
		ctx.stroke();
		// title
		ctx.fillStyle = C.black;
		ctx.textAlign = "center";
		ctx.font = "700 46px Helvetica, Arial, sans-serif";
		ctx.letterSpacing = "14px";
		ctx.fillText("MASSIVE ATTACK", 367, 860);
		ctx.font = "400 22px Helvetica, Arial, sans-serif";
		ctx.letterSpacing = "10px";
		ctx.fillText("MEZZANINE", 365, 905);
	});
}

function comicCover(bg: string, title: string) {
	return canvasTexture(256, 360, (ctx) => {
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, 256, 360);
		halftone(ctx, 256, 360, "rgba(0,0,0,0.3)", 8, 2);
		ctx.fillStyle = C.paper;
		ctx.fillRect(0, 0, 256, 80);
		ctx.fillStyle = C.black;
		ctx.font = "900 58px Impact, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(title, 128, 62);
		ctx.beginPath();
		ctx.arc(128, 220, 70, 0, Math.PI * 2);
		ctx.fill();
	});
}

const ART: Record<string, () => CanvasTexture> = {
	Poster_Doom: doomPoster,
	Poster_Beetle: beetlePoster,
	Comic_0: () => comicCover("#c23b2b", "ZAP!"),
	Comic_1: () => comicCover("#d9a441", "ACE"),
	Comic_2: () => comicCover("#3f6b5c", "VOID"),
	Comic_3: () => comicCover("#6d6a62", "NOVA"),
};

export function Room() {
	const { scene } = useGLTF(MODEL_URL);

	// Swap the exported PBR materials for toon ones, keeping their colours (and the bulb's glow), as Computer does.
	const meshes = useMemo(() => {
		const list: { name: string; mesh: Mesh; material: MeshToonMaterial }[] = [];
		scene.traverse((object) => {
			if (!(object as Mesh).isMesh) return;
			const mesh = object as Mesh;
			const source = mesh.material as MeshStandardMaterial;
			const map = ART[mesh.name]?.();
			const material = addGrain(
				new MeshToonMaterial({
					color: map ? "#ffffff" : source.color,
					map,
					emissive: source.emissive,
					emissiveIntensity: source.emissiveIntensity,
					gradientMap: toonRamp,
				}),
			);
			list.push({ name: mesh.name, mesh, material });
		});
		return list;
	}, [scene]);

	return (
		<group dispose={null}>
			{meshes.map(({ name, mesh, material }) => (
				<mesh key={name} name={name} castShadow receiveShadow geometry={mesh.geometry} material={material}>
					<Outlines {...INK} />
					<Edges threshold={25} color={INK.color} lineWidth={1} />
				</mesh>
			))}
		</group>
	);
}

useGLTF.preload(MODEL_URL);

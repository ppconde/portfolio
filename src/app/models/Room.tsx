import { Edges, Outlines, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { CanvasTexture, type Mesh, type MeshStandardMaterial, MeshToonMaterial, SRGBColorSpace } from "three";
import { addGrain, INK, toonRamp } from "./Computer";

// The desk corner around the PC, built by ~/Documents/models/room/build_room.py: one mesh per material, transforms
// already applied (desk top at y = 0). Poster_*, Comic_*, VHS_* and TVScreen keep 0-1 UVs; their art is drawn below on
// canvases.
// Served by this app's own worker (src/worker/index.ts) from R2, like pc.glb. The worker caches models as immutable,
// so a rebuilt room.glb is uploaded under a new name (room-2.glb, room-3.glb, ...) and this URL bumped.
const MODEL_URL = "/models/room-2.glb";

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

// Poster style after Ramon Nunez's sketch portraits: shapes filled with choppy rectangular brush blocks, loose pencil
// lines that overshoot them, lots of white paper. Seeded, so the art is the same on every load.
function rng(seed: number) {
	return () => {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	};
}

function poly(points: number[][]) {
	const path = new Path2D();
	for (const [x, y] of points) path.lineTo(x, y);
	path.closePath();
	return path;
}

// Fill `shape` with its base colour, then scatter blocks from the rest of the palette inside it.
function blocks(
	ctx: CanvasRenderingContext2D,
	shape: Path2D,
	[x, y, w, h]: number[],
	[base, ...palette]: string[],
	r: () => number,
	count = 140,
	size = 70,
) {
	ctx.save();
	ctx.clip(shape);
	ctx.fillStyle = base;
	ctx.fill(shape);
	for (let i = 0; i < count; i++) {
		ctx.globalAlpha = 0.45 + r() * 0.55;
		ctx.fillStyle = palette[Math.floor(r() * palette.length)];
		const bw = size * (0.2 + r());
		const bh = size * (0.08 + r() * 0.5);
		ctx.fillRect(x + r() * w - bw / 2, y + r() * h - bh / 2, bw, bh);
	}
	ctx.restore();
}

// A pencil line drawn a couple of times, each pass jittered, so it wobbles and overshoots like a quick sketch.
function sketch(ctx: CanvasRenderingContext2D, points: number[][], r: () => number, width = 4.5, passes = 2) {
	ctx.save();
	ctx.strokeStyle = "rgba(28,28,28,0.8)";
	ctx.lineWidth = width;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	for (let p = 0; p < passes; p++) {
		ctx.beginPath();
		for (const [x, y] of points) ctx.lineTo(x + (r() - 0.5) * 16, y + (r() - 0.5) * 16);
		ctx.stroke();
	}
	ctx.restore();
}

const PAPER = "#f4f1ea";
const INKS = ["#1a201c", "#26302a", "#0f1210", "#34403a", "#4a5850"];

// MF DOOM: close portrait in the metal mask, lit from the left, hood framing it, red cardigan and a mic.
function doomPoster() {
	return canvasTexture(720, 1000, (ctx) => {
		const r = rng(21);
		const METAL = ["#9c998f", "#b5b1a5", "#87847b", "#c9c5b8"];
		const LIT = ["#e4e0d3", "#f2efe6", "#d2cec1"];
		const SHADE = ["#5f5d57", "#4a4843", "#6f6c64", "#3a3935"];
		// paints `shape`, then lays highlight blocks on its left half and shadow blocks on its right
		const lit = (shape: Path2D, box: number[], count: number, size: number) => {
			blocks(ctx, shape, box, METAL, r, count, size);
			ctx.save();
			ctx.beginPath();
			ctx.rect(0, 0, 290, 1000);
			ctx.clip();
			blocks(ctx, shape, box, [LIT[0], ...LIT], r, count / 3, size * 0.6);
			ctx.restore();
			ctx.save();
			ctx.beginPath();
			ctx.rect(430, 0, 290, 1000);
			ctx.clip();
			blocks(ctx, shape, box, [SHADE[0], ...SHADE], r, count / 2, size * 0.7);
			ctx.restore();
		};
		ctx.fillStyle = PAPER;
		ctx.fillRect(0, 0, 720, 1000);
		// red cardigan, V neck
		const body = new Path2D();
		body.moveTo(40, 1000);
		body.quadraticCurveTo(70, 760, 250, 720);
		body.lineTo(360, 860);
		body.lineTo(470, 720);
		body.quadraticCurveTo(650, 760, 680, 1000);
		blocks(ctx, body, [40, 720, 640, 280], ["#b8322a", "#d9463a", "#8e2620", "#e0604a", "#6e1d18"], r, 170, 70);
		// hood
		const hood = new Path2D();
		hood.ellipse(360, 450, 230, 300, 0, 0, Math.PI * 2);
		blocks(ctx, hood, [130, 150, 460, 600], INKS, r, 220, 80);
		// skin behind the open mouth
		const mouth = poly([
			[300, 580],
			[420, 580],
			[430, 700],
			[290, 700],
		]);
		blocks(ctx, mouth, [290, 580, 140, 120], ["#8a5a3c", "#a46a46", "#6e4630", "#c08058"], r, 40, 30);
		ctx.fillStyle = "#2a1712";
		ctx.fillRect(318, 640, 84, 14);
		// mask: forehead plate down to the cheek plates, open at the mouth
		const mask = poly([
			[360, 230],
			[455, 270],
			[510, 360],
			[515, 500],
			[485, 590],
			[440, 600],
			[425, 575],
			[295, 575],
			[280, 600],
			[235, 590],
			[205, 500],
			[210, 360],
			[265, 270],
		]);
		lit(mask, [205, 230, 310, 370], 150, 55);
		// chin guard: two bars either side of the mouth
		for (const x of [282, 418])
			lit(
				poly([
					[x - 2, 590],
					[x + 22, 590],
					[x + 16, 720],
					[x + 4, 720],
				]),
				[x - 2, 590, 24, 130],
				16,
				16,
			);
		// nose ridge in shade, and the seam between the forehead and cheek plates
		ctx.fillStyle = "rgba(40,38,35,0.5)";
		ctx.fill(
			poly([
				[360, 440],
				[338, 545],
				[382, 545],
			]),
		);
		sketch(
			ctx,
			[
				[215, 470],
				[300, 488],
				[420, 488],
				[505, 470],
			],
			r,
			3,
			1,
		);
		// eye slits, angled down to the centre
		ctx.fillStyle = "#0f1210";
		ctx.fill(
			poly([
				[240, 400],
				[335, 418],
				[335, 440],
				[242, 424],
			]),
		);
		ctx.fill(
			poly([
				[480, 400],
				[385, 418],
				[385, 440],
				[478, 424],
			]),
		);
		// rivets
		for (const [x, y] of [
			[250, 330],
			[470, 330],
			[235, 540],
			[485, 540],
		]) {
			ctx.beginPath();
			ctx.arc(x, y, 7, 0, Math.PI * 2);
			ctx.fill();
		}
		// mic, crossing the lower right
		ctx.save();
		ctx.translate(560, 760);
		ctx.rotate(0.45);
		blocks(
			ctx,
			poly([
				[-18, 0],
				[18, 0],
				[13, 230],
				[-13, 230],
			]),
			[-18, 0, 36, 230],
			INKS,
			r,
			30,
			30,
		);
		const head = new Path2D();
		head.arc(0, -30, 38, 0, Math.PI * 2);
		blocks(ctx, head, [-38, -68, 76, 76], ["#3a3a3a", "#6b6b6b", "#9a9a9a", "#1c1c1c", "#c9c5b8"], r, 50, 24);
		ctx.restore();
		// pencil
		sketch(
			ctx,
			[
				[150, 560],
				[130, 400],
				[180, 250],
				[300, 165],
				[430, 160],
				[550, 240],
				[600, 380],
				[585, 560],
			],
			r,
		);
		sketch(
			ctx,
			[
				[215, 365],
				[260, 268],
				[360, 225],
				[460, 268],
				[512, 365],
			],
			r,
			3,
		);
		sketch(
			ctx,
			[
				[200, 505],
				[235, 595],
				[285, 605],
			],
			r,
			3,
		);
		sketch(
			ctx,
			[
				[520, 505],
				[488, 595],
				[436, 605],
			],
			r,
			3,
		);
		sketch(
			ctx,
			[
				[30, 1000],
				[70, 800],
				[240, 715],
				[360, 870],
				[480, 715],
				[650, 800],
				[690, 1000],
			],
			r,
			3.5,
		);
		sketch(
			ctx,
			[
				[110, 300],
				[70, 250],
				[95, 200],
				[140, 240],
			],
			r,
			3,
			1,
		);
		sketch(
			ctx,
			[
				[600, 200],
				[650, 160],
				[670, 220],
				[630, 260],
			],
			r,
			3,
			1,
		);
		// title, with a misregistered red print behind
		ctx.font = "900 150px Impact, 'Arial Narrow', sans-serif";
		ctx.textAlign = "center";
		ctx.fillStyle = "#c23b2b";
		ctx.fillText("MF DOOM", 368, 152);
		ctx.fillStyle = "#1c1c1c";
		ctx.fillText("MF DOOM", 360, 145);
	});
}

// Massive Attack, Mezzanine: a stag beetle, ink-dark blocks with a sheen, sketched legs, lots of white space.
function beetlePoster() {
	return canvasTexture(720, 1000, (ctx) => {
		const r = rng(11);
		ctx.fillStyle = PAPER;
		ctx.fillRect(0, 0, 720, 1000);
		// legs and mandibles in pencil
		for (const [y, dx, dy] of [
			[430, 150, -40],
			[500, 175, 20],
			[570, 150, 95],
		])
			for (const s of [-1, 1])
				sketch(
					ctx,
					[
						[360, y],
						[360 + s * dx * 0.7, y + dy * 0.4],
						[360 + s * dx, y + dy],
						[360 + s * dx * 1.1, y + dy + 30],
					],
					r,
					5,
				);
		for (const s of [-1, 1])
			sketch(
				ctx,
				[
					[360 + s * 30, 320],
					[360 + s * 105, 255],
					[360 + s * 95, 190],
					[360 + s * 30, 150],
					[360 + s * 10, 165],
				],
				r,
				9,
			);
		// body
		const body = new Path2D();
		body.ellipse(360, 340, 75, 45, 0, 0, Math.PI * 2);
		body.moveTo(445, 420);
		body.ellipse(360, 420, 85, 45, 0, 0, Math.PI * 2);
		body.moveTo(455, 560);
		body.ellipse(360, 560, 95, 130, 0, 0, Math.PI * 2);
		blocks(ctx, body, [265, 295, 190, 400], INKS, r, 170, 50);
		// sheen on the wing case
		blocks(
			ctx,
			poly([
				[300, 470],
				[340, 450],
				[345, 640],
				[305, 600],
			]),
			[300, 450, 45, 190],
			["#4a5850", "#7f8f84", "#a9b6ad"],
			r,
			25,
			30,
		);
		ctx.strokeStyle = PAPER;
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(360, 440);
		ctx.lineTo(360, 685);
		ctx.stroke();
		sketch(
			ctx,
			[
				[265, 560],
				[270, 470],
				[300, 420],
				[360, 400],
				[430, 420],
				[460, 500],
				[455, 620],
				[400, 700],
				[330, 705],
			],
			r,
			2,
		);
		// one red accent, like the reference's ring
		ctx.fillStyle = "#c23b2b";
		ctx.fillRect(470, 760, 70, 26);
		// title
		ctx.fillStyle = "#1c1c1c";
		ctx.textAlign = "center";
		ctx.font = "700 46px Helvetica, Arial, sans-serif";
		ctx.letterSpacing = "14px";
		ctx.fillText("MASSIVE ATTACK", 367, 860);
		ctx.font = "400 22px Helvetica, Arial, sans-serif";
		ctx.letterSpacing = "10px";
		ctx.fillText("MEZZANINE", 365, 905);
	});
}

// Comic covers in the poster style: a block-painted colour field, an ink-block figure sketched in pencil, title on paper.
function comicCover(colours: string[], title: string, seed: number) {
	return canvasTexture(256, 360, (ctx) => {
		const r = rng(seed);
		blocks(
			ctx,
			poly([
				[0, 0],
				[256, 0],
				[256, 360],
				[0, 360],
			]),
			[0, 0, 256, 360],
			colours,
			r,
			90,
			50,
		);
		// figure: head and shoulders
		const figure = new Path2D();
		figure.ellipse(128, 200, 48, 58, 0, 0, Math.PI * 2);
		figure.moveTo(40, 360);
		figure.quadraticCurveTo(60, 270, 128, 262);
		figure.quadraticCurveTo(196, 270, 216, 360);
		blocks(ctx, figure, [40, 142, 176, 218], INKS, r, 70, 34);
		sketch(
			ctx,
			[
				[86, 230],
				[78, 180],
				[100, 145],
				[140, 138],
				[176, 170],
				[178, 225],
			],
			r,
			2.5,
		);
		sketch(
			ctx,
			[
				[30, 355],
				[55, 285],
				[120, 260],
			],
			r,
			2,
		);
		sketch(
			ctx,
			[
				[226, 355],
				[205, 285],
				[140, 262],
			],
			r,
			2,
		);
		// title band
		ctx.fillStyle = PAPER;
		ctx.fillRect(0, 0, 256, 80);
		sketch(
			ctx,
			[
				[-10, 82],
				[128, 78],
				[266, 84],
			],
			r,
			2,
			1,
		);
		ctx.fillStyle = "#1c1c1c";
		ctx.font = "900 58px Impact, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(title, 128, 62);
	});
}

// VHS spines after the reference flyer: black cases with a cream label hand-lettered in red marker, or a printed
// brand spine with colour stripes.
type Spine = { kind: "label"; text: string } | { kind: "stripes"; text: string; stripes: string[]; light: boolean };

function vhsSpine(spine: Spine, seed: number) {
	return canvasTexture(1024, 120, (ctx) => {
		const r = rng(seed);
		ctx.fillStyle = "#151515";
		ctx.fillRect(0, 0, 1024, 120);
		ctx.textBaseline = "middle";
		if (spine.kind === "label") {
			const x = 140 + r() * 80;
			ctx.fillStyle = "#ece2c6";
			ctx.fillRect(x, 14, 680, 92);
			sketch(
				ctx,
				[
					[x, 14],
					[x + 680, 14],
					[x + 680, 106],
					[x, 106],
					[x, 14],
				],
				r,
				2,
				1,
			);
			ctx.fillStyle = "#c23b2b";
			ctx.font = "700 56px 'Marker Felt', 'Comic Sans MS', cursive";
			ctx.textAlign = "center";
			ctx.fillText(spine.text, x + 340, 62);
			ctx.fillStyle = "#1c1c1c";
			ctx.font = "700 18px Helvetica, Arial, sans-serif";
			ctx.fillText("T-120", x + 640, 40);
		} else {
			if (spine.light) {
				ctx.fillStyle = "#ece2c6";
				ctx.fillRect(0, 0, 1024, 120);
			}
			spine.stripes.forEach((colour, i) => {
				ctx.fillStyle = colour;
				ctx.fillRect(560 + i * 80, 0, 80, 120);
			});
			ctx.fillStyle = spine.light ? "#1c1c1c" : "#ece2c6";
			ctx.font = "800 54px Helvetica, Arial, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(spine.text, 70, 62);
			ctx.font = "700 18px Helvetica, Arial, sans-serif";
			ctx.fillText("VHS", 900, 62);
		}
	});
}

// VCR blue screen with the on-screen "PLAY" display and faint scanlines; also used as the screen's glow.
function tvScreen() {
	return canvasTexture(512, 370, (ctx) => {
		ctx.fillStyle = "#1d3a8a";
		ctx.fillRect(0, 0, 512, 370);
		ctx.fillStyle = "rgba(0,0,0,0.18)";
		for (let y = 0; y < 370; y += 4) ctx.fillRect(0, y, 512, 2);
		ctx.fillStyle = "#e8eefc";
		ctx.font = "700 46px 'Courier New', monospace";
		ctx.textBaseline = "top";
		ctx.fillText("PLAY ▶", 40, 40);
		ctx.fillText("0:12:47", 280, 290);
	});
}

const RAINBOW = ["#7b4f9e", "#d9466f", "#ec7a3a", "#f0c040"];

const ART: Record<string, () => CanvasTexture> = {
	TVScreen: tvScreen,
	VHS_0: () => vhsSpine({ kind: "label", text: "Live Music" }, 31),
	VHS_1: () => vhsSpine({ kind: "stripes", text: "Rewind 80", stripes: RAINBOW, light: true }, 32),
	VHS_2: () => vhsSpine({ kind: "label", text: "Red Rocks" }, 33),
	VHS_3: () =>
		vhsSpine({ kind: "stripes", text: "RETRO", stripes: ["#4fb3c8", "#3f9a6a", "#c23b2b"], light: false }, 34),
	VHS_4: () => vhsSpine({ kind: "label", text: "Do not tape over!" }, 35),
	VHS_5: () => vhsSpine({ kind: "label", text: "Summer '94" }, 36),
	Poster_Doom: doomPoster,
	Poster_Beetle: beetlePoster,
	Comic_0: () => comicCover(["#c23b2b", "#d9463a", "#8e2620", "#e0604a"], "ZAP!", 3),
	Comic_1: () => comicCover(["#d9a441", "#e8bd5f", "#b8842e", "#f0d08a"], "ACE", 5),
	Comic_2: () => comicCover(["#3f6b5c", "#55836f", "#2c5044", "#6f9a86"], "VOID", 9),
	Comic_3: () => comicCover(["#6d6a62", "#858278", "#55524b", "#a09c90"], "NOVA", 13),
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
					map: map ?? null,
					emissive: source.emissive,
					emissiveMap: mesh.name === "TVScreen" ? map : null,
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

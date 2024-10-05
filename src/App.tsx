import { Canvas } from "@react-three/fiber";
import Experience from "./Experience";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";

export default function App() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [3, 2, 6],
        }}
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: SRGBColorSpace,
        }}
      >
        <Experience />
      </Canvas>
    </div>
  )
}

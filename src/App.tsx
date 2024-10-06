import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { Suspense } from "react";
import { Experience } from "./Experience";
import { Loader } from "./Loader";

export function App() {
  return (
    <div className="h-screen w-screen absolute top-0 left-0">
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
        shadows
      >
        <Suspense fallback={<Loader />}>
          <Experience />
        </Suspense>
      </Canvas>
      <div className="absolute top-0 flex justify-center items-center h-screen w-screen">
        <div className="text-center">
          <h1 className="text-6xl mb-4">👋 Hello, I'm Pedro Conde</h1>
          <p className="text-lg mb-2">This site is currently under construction.</p>
          <p className="text-lg mb-4">In the meantime, feel free to reach out to me or follow me on social media:</p>

          <div className="text-lg text-center">
            <a className="text-blue-500 hover:underline" href="https://www.linkedin.com/in/ppconde/" target="_blank">LinkedIn</a><span> | </span>
            <a className="text-blue-500 hover:underline" href="https://github.com/ppconde/" target="_blank">GitHub</a>
          </div>
        </div>
      </div>
    </div>
  )
}

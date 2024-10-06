import { Suspense } from "react"
import { DoubleSide } from "three"

import { Loader } from "./Loader"
import { Miles } from "./models/Miles"
import { useControls } from "leva"
import { Perf } from "r3f-perf"

export function Experience() {

  const { positionX, positionY, positionZ, rotationX, rotationY, rotationZ } = useControls('Miles', {
    positionX: { value: 2, min: -10, max: 10, step: 0.1 },
    positionY: { value: -2, min: -10, max: 10, step: 0.1 },
    positionZ: { value: 0, min: -10, max: 10, step: 0.1 },
    rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationY: { value: -0.6, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
  });


  const { perfVisible } = useControls('Perf', { perfVisible: false });

  return (
    <>
      {perfVisible ? <Perf position="top-left" /> : null}
      <ambientLight intensity={1.5} />
      <directionalLight
        castShadow
        position={[1, 2, 3]}
        intensity={24.5}
        shadow-normalBias={0.04}
      />
      <Suspense fallback={<Loader />}>
        <Miles
          position={[positionX, positionY, positionZ]}
          rotation={[rotationX, rotationY, rotationZ]}
        />
      </Suspense>
      <mesh
        rotation-x={-Math.PI * 0.5}
        position-y={-2}
        scale={10}
        receiveShadow
      >
        <planeGeometry />
        <meshStandardMaterial color={'#f7faff'} side={DoubleSide} />
      </mesh>
    </>
  )
}
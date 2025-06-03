import { Suspense, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DoubleSide } from "three";
import { Computer } from "./models/Computer";
import { Loader } from "./Loader";
import { useControls } from "leva";
import { Perf } from "r3f-perf";

export function Experience({
  onScreenPositionChange,
}: {
  onScreenPositionChange: (coords: { x: number; y: number }) => void;
}) {
  const pcRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();

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

  const { perfVisible } = useControls("Perf", { perfVisible: false });

  // Update screen position each frame
  useFrame(() => {
    if (pcRef.current) {
      const screenPos = new THREE.Vector3();
      // Adjust to your screen's actual position within the mesh
      pcRef.current.getWorldPosition(screenPos);
      screenPos.project(camera);

      const x = (screenPos.x * 0.5 + 0.5) * size.width;
      const y = (1 - (screenPos.y * 0.5 + 0.5)) * size.height;

      onScreenPositionChange({ x, y });
    }
  });

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
        <Computer
          ref={pcRef}
          position={[pcPositionX, pcPositionY, pcPositionZ]}
          rotation={[pcRotationX, pcRotationY, pcRotationZ]}
        />
      </Suspense>
      <mesh
        rotation-x={-Math.PI * 0.5}
        position-y={-2}
        scale={10}
        receiveShadow
      >
        <planeGeometry />
        <meshStandardMaterial color={"#f7faff"} side={DoubleSide} />
      </mesh>
    </>
  );
}

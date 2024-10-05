import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Mesh } from "three"

export function Experience() {
  const torusRef = useRef<Mesh>(null);

  useFrame(() => {
    if (torusRef.current) {
      torusRef.current.rotation.y += 0.002;
      torusRef.current.rotation.x += 0.001;
    }
  })

  return (
    <mesh ref={torusRef} rotation={[Math.PI / 10, 10, 10]}>
      <torusGeometry />
      <meshNormalMaterial transparent opacity={0.1} />
    </mesh>
  )
}
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Monochrome field: faint gray points on white + a single green wireframe accent.
function Particles({ count = 900 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.02;
    ref.current.rotation.x += delta * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#9aa39a" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function Shape() {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const { x, y } = state.pointer;
    ref.current.rotation.y += 0.002;
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, y * 0.4, 0.03);
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, x * 0.6, 0.04);
  });
  return (
    <mesh ref={ref} position={[2.4, 0, -2]}>
      <icosahedronGeometry args={[1.6, 1]} />
      <meshBasicMaterial color="#1f8a4c" wireframe transparent opacity={0.16} />
    </mesh>
  );
}

export default function Background3D() {
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className="bg-canvas">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 1.75]}>
        <color attach="background" args={['#ffffff']} />
        <fog attach="fog" args={['#ffffff', 7, 16]} />
        <Particles />
        {!reduced && <Shape />}
      </Canvas>
    </div>
  );
}

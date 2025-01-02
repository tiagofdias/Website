import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import CanvasLoader from "../Loader";

const Stormtrooper = () => {
  const Stormtrooper = useGLTF("./dancing-stormtrooper/scene.gltf");

  return (
    <primitive object={Stormtrooper.scene} scale={5} position-y={-5} rotation-y={0} />
  );
};

const StormtrooperCanvas = () => {
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true }}
      camera={{
        fov: 100,
        near: 0.1,
        far: 700, // Further increased to accommodate a larger model
        position: [0, 10, 0], // Adjusted for larger model
      }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          autoRotate
          enableZoom={true}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        <Stormtrooper />
        <Preload all />
      </Suspense>
    </Canvas>
  );
};

export default StormtrooperCanvas;

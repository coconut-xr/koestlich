/* eslint-disable react/no-unknown-property */
import { Canvas, useThree } from "@react-three/fiber";
import React, { ReactNode } from "react";
import { PerspectiveCamera } from "three";
import { RootContainer, clippingEvents } from "./index.js";

export function KoestlichTestCanvas({ children }: { children?: ReactNode }) {
  return (
    <Canvas
      events={clippingEvents}
      dpr={window.devicePixelRatio}
      gl={{ localClippingEnabled: true }}
      style={{
        height: "100svh",
        width: "100vw",
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      <ambientLight />
      <FullscreenHelper>{children}</FullscreenHelper>
    </Canvas>
  );
}

function FullscreenHelper({ children }: { children?: ReactNode }) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);

  const fovAngle = (camera as PerspectiveCamera).fov;
  const fovRad = (fovAngle * Math.PI) / 180;
  const distance = 0.5 / Math.tan(fovRad / 2);

  return (
    <primitive object={camera}>
      <RootContainer
        position={[0, 0, -distance]}
        overflow="scroll"
        pixelSize={1 / size.height}
        sizeX={size.width / size.height}
        sizeY={1}
        anchorX="center"
        anchorY="center"
        precision={0.1}
      >
        {children}
      </RootContainer>
    </primitive>
  );
}

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, SoftShadows } from '@react-three/drei';
import Scene, { ROOM_COORDS } from './Scene';

interface FacilityMapProps {
  guestLocation?: string;
  selectedRoomId?: string | null;
  onRoomSelect?: (id: string) => void;
  activeCrisis?: any;
}

export default function FacilityMap({ guestLocation, selectedRoomId, onRoomSelect, activeCrisis }: FacilityMapProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate the guest's perspective / point of view framing the exit
  const markerPos = (guestLocation && ROOM_COORDS[guestLocation]) ? ROOM_COORDS[guestLocation] : [0, 0, 0];
  const guestX = markerPos[0];
  const guestZ = markerPos[2];
  
  const exitX = guestX < 0 ? -16 : 16;
  const exitZ = -2;
  
  // Center camera exactly halfway between the guest and their nearest exit to frame the route
  const midX = (guestX + exitX) / 2;
  const midZ = (guestZ + exitZ) / 2;

  // Zoom in nicely on this specific route
  const camX = midX;
  const camY = isMobile ? 40 : 25; 
  const camZ = midZ + (isMobile ? 40 : 25);

  return (
    <Canvas
      shadows
      camera={{ position: [camX, camY, camZ], fov: 40, near: 0.1, far: 1000 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={['#a2d1c6']} />
      <ambientLight intensity={0.6} />
      <directionalLight
        castShadow
        position={[10, 20, 5]}
        intensity={1.2}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#b4e6db" />

      <Suspense fallback={null}>
        <Scene 
          guestLocation={guestLocation}
          selectedRoomId={selectedRoomId}
          onRoomSelect={onRoomSelect}
          activeCrisis={activeCrisis}
        />
        <ContactShadows position={[0, -0.05, 0]} opacity={0.4} scale={50} blur={2} far={10} />
      </Suspense>

      <OrbitControls
        makeDefault
        target={[midX, 0, midZ]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={10}
        maxDistance={100}
        enablePan={true}
        enableDamping={true}
      />
    </Canvas>
  );
}

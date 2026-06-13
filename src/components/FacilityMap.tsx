import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import Scene, { ROOM_COORDS } from './Scene';

interface FacilityMapProps {
  guestLocation?: string;
  selectedRoomId?: string | null;
  onRoomSelect?: (id: string) => void;
  activeCrisis?: any;
}

// Handles smooth camera transitions based on crisis state
function CameraController({ activeCrisis, guestLocation, isMobile }: { activeCrisis: any, guestLocation?: string, isMobile: boolean }) {
  const { camera, controls } = useThree();
  const targetCameraPos = useRef(new THREE.Vector3());
  const targetOrbitTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (activeCrisis && guestLocation) {
      // CRISIS MODE: Zoom in on the guest's specific route
      const markerPos = ROOM_COORDS[guestLocation] || [0, 0, 0];
      const guestX = markerPos[0];
      const guestZ = markerPos[2];
      
      const exitX = guestX < 0 ? -16 : 16;
      const exitZ = -2;
      
      // Center on the route
      const midX = (guestX + exitX) / 2;
      const midZ = (guestZ + exitZ) / 2;
      
      // Tightly framed zoom
      const camY = isMobile ? 35 : 20; 
      const camZ = midZ + (isMobile ? 35 : 20);
      
      targetCameraPos.current.set(midX, camY, camZ);
      targetOrbitTarget.current.set(midX, 0, midZ);
    } else {
      // STANDARD MODE: Zoomed out, overview of the facility
      // Slightly zoomed in per user request
      const camY = isMobile ? 42 : 28;
      const camZ = isMobile ? 42 : 28;
      
      targetCameraPos.current.set(0, camY, camZ);
      targetOrbitTarget.current.set(0, 0, -2); // Centered on Main Corridor
    }
  }, [activeCrisis, guestLocation, isMobile]);

  // Smoothly animate the camera to the target positions
  useFrame((state, delta) => {
    if (!controls) return;
    
    // Lerp camera position
    camera.position.lerp(targetCameraPos.current, delta * 2.5);
    
    // Lerp OrbitControls target
    const orbitControls = controls as any;
    orbitControls.target.lerp(targetOrbitTarget.current, delta * 2.5);
    orbitControls.update();
  });

  return null;
}

export default function FacilityMap({ guestLocation, selectedRoomId, onRoomSelect, activeCrisis }: FacilityMapProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initial camera position matches the standard slightly zoomed in view
  const initialCamY = isMobile ? 42 : 28;
  const initialCamZ = isMobile ? 42 : 28;

  return (
    <Canvas
      shadows
      camera={{ position: [0, initialCamY, initialCamZ], fov: 40, near: 0.1, far: 1000 }}
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
        target={[0, 0, -2]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={10}
        maxDistance={100}
        enablePan={true}
        enableDamping={true}
      />
      
      <CameraController 
        activeCrisis={activeCrisis} 
        guestLocation={guestLocation} 
        isMobile={isMobile} 
      />
    </Canvas>
  );
}

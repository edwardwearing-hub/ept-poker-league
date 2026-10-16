'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';

interface CanvasContainerProps {
    children: React.ReactNode;
    className?: string;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    enableZoom?: boolean;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    intensity?: number;
}

export function CanvasLoadingSpinner() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-[#cfb53b]/20 border-t-[#ffd700] animate-spin" />
                <span className="text-[10px] font-mono text-[#cfb53b] uppercase tracking-widest">Loading 3D...</span>
            </div>
        </div>
    );
}

export default function CanvasContainer({
    children,
    className = 'w-full h-64',
    autoRotate = true,
    autoRotateSpeed = 1.5,
    enableZoom = false,
    minPolarAngle = Math.PI / 4,
    maxPolarAngle = Math.PI / 1.8,
    intensity = 0.6,
}: CanvasContainerProps) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <Suspense fallback={<CanvasLoadingSpinner />}>
                <Canvas
                    camera={{ position: [0, 0, 4.5], fov: 45 }}
                    frameloop="demand"
                    dpr={[1, 2]}
                    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1.2} />
                    <directionalLight position={[-10, 10, -5]} intensity={0.6} color="#ffd700" />
                    
                    <Stage
                        environment="city"
                        intensity={intensity}
                        adjustCamera={false}
                    >
                        {children}
                    </Stage>

                    <OrbitControls
                        enableZoom={enableZoom}
                        autoRotate={autoRotate}
                        autoRotateSpeed={autoRotateSpeed}
                        minPolarAngle={minPolarAngle}
                        maxPolarAngle={maxPolarAngle}
                        enablePan={false}
                    />
                </Canvas>
            </Suspense>
        </div>
    );
}

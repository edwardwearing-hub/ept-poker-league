'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export interface ChipProps {
    value?: number;
    label?: string;
    primaryColor?: string;
    secondaryColor?: string;
    scale?: number;
    interactive?: boolean;
}

export default function PokerChip({
    value = 500,
    label = '500',
    primaryColor = '#16a34a', // Default green
    secondaryColor = '#ffffff',
    scale = 1.3,
}: ChipProps) {
    const chipRef = useRef<THREE.Group>(null);

    // Continuous smooth tumble/rotation
    useFrame((state) => {
        if (!chipRef.current) return;
        const t = state.clock.getElapsedTime();
        chipRef.current.rotation.x = Math.sin(t * 0.8) * 0.3 + 0.4;
        chipRef.current.rotation.y += 0.01;
    });

    const edgeInserts = 8;

    return (
        <group ref={chipRef} scale={scale} dispose={null}>
            {/* Main Ceramic Chip Body */}
            <mesh>
                <cylinderGeometry args={[1.5, 1.5, 0.22, 64]} />
                <meshStandardMaterial
                    color={primaryColor}
                    roughness={0.35}
                    metalness={0.2}
                />
            </mesh>

            {/* Edge Inlay Markings / Spots around the perimeter */}
            {Array.from({ length: edgeInserts }).map((_, i) => {
                const angle = (i / edgeInserts) * Math.PI * 2;
                const x = Math.cos(angle) * 1.35;
                const z = Math.sin(angle) * 1.35;
                return (
                    <mesh key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
                        <boxGeometry args={[0.3, 0.23, 0.38]} />
                        <meshStandardMaterial
                            color={secondaryColor}
                            roughness={0.35}
                            metalness={0.15}
                        />
                    </mesh>
                );
            })}

            {/* Front Inlay Disc (White/Gold Accent) */}
            <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.9, 1.25, 64]} />
                <meshStandardMaterial
                    color={secondaryColor}
                    roughness={0.25}
                    metalness={0.4}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh position={[0, 0.116, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.9, 64]} />
                <meshStandardMaterial
                    color="#0c0c0c"
                    roughness={0.2}
                    metalness={0.5}
                />
            </mesh>

            {/* Front Denomination Text */}
            <group position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <Text
                    position={[0, 0.35, 0]}
                    fontSize={0.14}
                    color="#ffd700"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.15}
                >
                    E.P.T. LEAGUE
                </Text>
                <Text
                    position={[0, -0.05, 0]}
                    fontSize={0.45}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    {label}
                </Text>
                <Text
                    position={[0, -0.4, 0]}
                    fontSize={0.12}
                    color="#ffd700"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.1}
                >
                    TOURNAMENT
                </Text>
            </group>

            {/* Back Inlay Disc (White/Gold Accent) */}
            <mesh position={[0, -0.115, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.9, 1.25, 64]} />
                <meshStandardMaterial
                    color={secondaryColor}
                    roughness={0.25}
                    metalness={0.4}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh position={[0, -0.116, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.9, 64]} />
                <meshStandardMaterial
                    color="#0c0c0c"
                    roughness={0.2}
                    metalness={0.5}
                />
            </mesh>

            {/* Back Denomination Text */}
            <group position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, Math.PI]}>
                <Text
                    position={[0, 0.35, 0]}
                    fontSize={0.14}
                    color="#ffd700"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.15}
                >
                    E.P.T. LEAGUE
                </Text>
                <Text
                    position={[0, -0.05, 0]}
                    fontSize={0.45}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    {label}
                </Text>
                <Text
                    position={[0, -0.4, 0]}
                    fontSize={0.12}
                    color="#ffd700"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.1}
                >
                    TOURNAMENT
                </Text>
            </group>
        </group>
    );
}

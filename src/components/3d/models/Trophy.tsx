'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export default function Trophy(props: { scale?: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const scale = props.scale ?? 1.1;

    // Gentle ambient floating/wobble
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.04 - 0.2;
    });

    // Gold material parameters
    const goldMaterial = (
        <meshStandardMaterial
            color="#ffd700"
            metalness={0.92}
            roughness={0.18}
            envMapIntensity={1.5}
        />
    );

    // Marble / Obsidian base material
    const baseMaterial = (
        <meshStandardMaterial
            color="#141414"
            roughness={0.3}
            metalness={0.15}
        />
    );

    const plaqueMaterial = (
        <meshStandardMaterial
            color="#e6ca65"
            metalness={0.88}
            roughness={0.25}
        />
    );

    return (
        <group ref={groupRef} scale={scale} dispose={null}>
            {/* 1. Tiered Marble Pedestal */}
            <mesh position={[0, -1.2, 0]}>
                <cylinderGeometry args={[0.9, 1.0, 0.25, 32]} />
                {baseMaterial}
            </mesh>
            <mesh position={[0, -0.95, 0]}>
                <cylinderGeometry args={[0.75, 0.85, 0.3, 32]} />
                {baseMaterial}
            </mesh>

            {/* Gold engraved plaque on base */}
            <mesh position={[0, -0.95, 0.76]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.7, 0.16, 0.04]} />
                {plaqueMaterial}
            </mesh>

            {/* 2. Lower Gold Base Collar & Ring */}
            <mesh position={[0, -0.75, 0]}>
                <cylinderGeometry args={[0.65, 0.72, 0.12, 32]} />
                {goldMaterial}
            </mesh>
            <mesh position={[0, -0.62, 0]}>
                <torusGeometry args={[0.55, 0.08, 16, 32]} />
                {goldMaterial}
            </mesh>

            {/* 3. Tapered Classical Gold Stem */}
            <mesh position={[0, -0.35, 0]}>
                <cylinderGeometry args={[0.22, 0.42, 0.45, 32]} />
                {goldMaterial}
            </mesh>
            <mesh position={[0, -0.1, 0]}>
                <torusGeometry args={[0.3, 0.06, 16, 32]} />
                {goldMaterial}
            </mesh>

            {/* 4. Main Championship Chalice / Urn */}
            {/* Lower cup bowl */}
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.75, 0.25, 0.65, 32]} />
                {goldMaterial}
            </mesh>
            {/* Upper cup body */}
            <mesh position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.9, 0.75, 0.45, 32]} />
                {goldMaterial}
            </mesh>
            {/* Flared lip / rim */}
            <mesh position={[0, 0.98, 0]}>
                <torusGeometry args={[0.92, 0.06, 16, 48]} />
                {goldMaterial}
            </mesh>
            {/* Interior hollow illusion */}
            <mesh position={[0, 0.92, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.88, 32]} />
                <meshStandardMaterial color="#8a731b" roughness={0.4} metalness={0.7} side={THREE.DoubleSide} />
            </mesh>

            {/* 5. Dual Sculpted Handles */}
            <group position={[0, 0.55, 0]}>
                {/* Left Handle */}
                <mesh position={[-0.95, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <torusGeometry args={[0.35, 0.07, 16, 32, Math.PI * 1.3]} />
                    {goldMaterial}
                </mesh>
                {/* Right Handle */}
                <mesh position={[0.95, 0, 0]} rotation={[0, 0, -Math.PI / 4 + Math.PI]}>
                    <torusGeometry args={[0.35, 0.07, 16, 32, Math.PI * 1.3]} />
                    {goldMaterial}
                </mesh>
            </group>

            {/* 6. Trophy Crown / Spade Finial Crest */}
            <group position={[0, 1.25, 0]}>
                {/* Small central pedestal */}
                <mesh position={[0, -0.15, 0]}>
                    <cylinderGeometry args={[0.15, 0.25, 0.15, 16]} />
                    {goldMaterial}
                </mesh>
                {/* Crown / Spade Emblem */}
                <mesh position={[0, 0.05, 0]}>
                    <octahedronGeometry args={[0.2, 0]} />
                    {goldMaterial}
                </mesh>
                <mesh position={[0, 0.22, 0]}>
                    <coneGeometry args={[0.12, 0.25, 4]} />
                    {goldMaterial}
                </mesh>
            </group>
        </group>
    );
}

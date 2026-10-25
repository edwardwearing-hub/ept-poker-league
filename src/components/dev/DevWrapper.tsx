'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';

export interface DevWrapperProps {
  id: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
}

const DevWrapperOverlayLazy =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('./DevWrapperClient'), { ssr: false })
    : null;

const DevModeFloatingDockLazy =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('./DevModeFloatingDock'), { ssr: false })
    : null;

export function DevModeDock() {
  if (process.env.NODE_ENV === 'production' || !DevModeFloatingDockLazy) {
    return null;
  }
  return <DevModeFloatingDockLazy />;
}

export default function DevWrapper({
  id,
  label,
  className = '',
  children,
}: DevWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  if (process.env.NODE_ENV === 'production') {
    return className ? <div className={className}>{children}</div> : <>{children}</>;
  }

  return (
    <div
      ref={wrapperRef}
      data-dev-container-id={id}
      className={`relative ${className}`}
    >
      {DevWrapperOverlayLazy && (
        <DevWrapperOverlayLazy id={id} label={label} wrapperRef={wrapperRef} />
      )}
      {children}
    </div>
  );
}

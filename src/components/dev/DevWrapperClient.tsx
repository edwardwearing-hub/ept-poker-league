'use client';

import React, { useEffect } from 'react';
import { useDevModeStore } from './DevModeContext';

export interface DevOverlayClientProps {
  id: string;
  label?: string;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Lightweight bridge for explicit <DevWrapper /> containers.
 * Tags the DOM element with its human-readable label and applies subtle dashed outlines
 * in Dev Mode while DevUniversalInspector handles single & multi-element selection,
 * simultaneous group resizing, and header dragging across the entire application.
 */
export default function DevWrapperClient({
  id,
  label,
  wrapperRef,
}: DevOverlayClientProps) {
  const { isDevMode, selectedIds, layouts } = useDevModeStore();
  const isSelected = selectedIds.includes(id);
  const savedConfig = layouts[id];

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (label) {
      el.setAttribute('data-dev-label', label);
    }
  }, [label, wrapperRef]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    if (typeof savedConfig?.width === 'number') {
      el.style.width = `${savedConfig.width}px`;
      el.style.maxWidth = 'none';
    } else {
      el.style.width = '';
      el.style.maxWidth = '';
    }

    if (typeof savedConfig?.height === 'number') {
      el.style.height = `${savedConfig.height}px`;
      el.style.minHeight = `${savedConfig.height}px`;
    } else {
      el.style.height = '';
      el.style.minHeight = '';
    }

    if (
      (typeof savedConfig?.x === 'number' && savedConfig.x !== 0) ||
      (typeof savedConfig?.y === 'number' && savedConfig.y !== 0)
    ) {
      el.style.transform = `translate3d(${savedConfig?.x ?? 0}px, ${
        savedConfig?.y ?? 0
      }px, 0)`;
    } else {
      el.style.transform = '';
    }

    if (typeof savedConfig?.order === 'number' && savedConfig.order !== 0) {
      el.style.order = String(savedConfig.order);
    } else {
      el.style.order = '';
    }

    if (isDevMode && !isSelected) {
      el.style.outline = '1px dashed rgba(255, 215, 0, 0.45)';
      el.style.outlineOffset = '2px';
    } else {
      el.style.outline = '';
      el.style.outlineOffset = '';
    }
  }, [isDevMode, isSelected, savedConfig, wrapperRef]);

  return null;
}

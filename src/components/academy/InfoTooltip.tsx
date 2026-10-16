'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  description: string;
  formula?: string;
  example?: string;
  children?: React.ReactNode;
  iconOnly?: boolean;
  size?: number;
  className?: string;
}

export default function InfoTooltip({
  title,
  description,
  formula,
  example,
  children,
  iconOnly = false,
  size = 14,
  className = '',
}: InfoTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: true,
  });
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const isOpen = isHovered || isPinned;

  const updatePosition = () => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 290;
    const spaceAbove = rect.top;
    const placeAbove = spaceAbove > 180;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, left));

    const top = placeAbove ? rect.top - 10 : rect.bottom + 10;
    setCoords({ top, left, placeAbove });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close pinned tooltip when clicking outside
  useEffect(() => {
    if (!isPinned) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        (!popoverRef.current || !popoverRef.current.contains(target))
      ) {
        setIsPinned(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isPinned]);

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    updatePosition();
    setIsPinned((prev) => !prev);
  };

  return (
    <span
      ref={triggerRef}
      onMouseEnter={() => {
        updatePosition();
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      className={`inline-flex items-center gap-1.5 cursor-help select-none ${className}`}
    >
      {children}
      <button
        type="button"
        onClick={handleTogglePin}
        aria-label={`Info about ${title}`}
        className={`inline-flex items-center justify-center rounded-full p-0.5 transition-all shrink-0 ${
          isPinned
            ? 'bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.8)] scale-110'
            : 'text-gold/75 hover:text-gold hover:bg-gold/15'
        }`}
      >
        <Info size={size} />
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: coords.placeAbove ? 'translateY(-100%)' : 'translateY(0)',
              width: 290,
              zIndex: 99999,
            }}
            className="rounded-xl bg-[#111111]/95 backdrop-blur-xl border border-gold/50 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(212,175,55,0.2)] text-left font-sans animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5 pb-1.5 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <Info size={13} className="text-gold shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-gold">
                  {title}
                </span>
              </div>
              {isPinned && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPinned(false);
                    setIsHovered(false);
                  }}
                  className="text-zinc-400 hover:text-white p-0.5 rounded"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <p className="text-xs text-zinc-200 leading-relaxed font-normal">
              {description}
            </p>

            {formula && (
              <div className="mt-2 p-2 rounded-lg bg-black/70 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
                {formula}
              </div>
            )}

            {example && (
              <div className="mt-2 text-[11px] text-amber-300/90 italic">
                💡 {example}
              </div>
            )}

            <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-500 uppercase tracking-widest">
              <span>{isPinned ? 'Pinned (Click ⓘ or × to close)' : 'Click ⓘ to pin open'}</span>
              <span className="text-gold/60">E.P.T. Guide</span>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}

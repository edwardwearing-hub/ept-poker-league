'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  GripHorizontal,
  GripVertical,
  ArrowUpDown,
  RotateCcw,
  Maximize2,
  Move,
  Layers,
  CornerLeftUp,
  CornerRightDown,
  CheckSquare,
  Group,
  Ungroup,
  BringToFront,
  SendToBack,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Grid,
  Magnet,
  Sparkles,
  Pin,
  PinOff,
  CopyCheck,
  ClipboardCopy,
  ClipboardPaste,
  Share2,
  Check,
  Undo2,
  Redo2,
} from 'lucide-react';
import {
  useDevModeStore,
  ContainerLayoutConfig,
  CopiedItemStyle,
} from './DevModeContext';

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'e' | 's';

interface ElementBoxMetrics {
  id: string;
  label: string;
  el: HTMLElement;
  top: number;
  left: number;
  width: number;
  height: number;
  padding: string;
  margin: string;
  x: number;
  y: number;
  order: number;
  zIndex: number;
  groupId?: string;
  overlapFree?: boolean;
}

interface MultiDragTarget {
  id: string;
  label: string;
  selector: string;
  relativeSelector: string;
  pageScope: string;
  el: HTMLElement;
  startRectTop: number;
  startRectLeft: number;
  startWidth: number;
  startHeight: number;
  startX: number;
  startY: number;
  curWidth: number;
  curHeight: number;
  curX: number;
  curY: number;
  padding: string;
  margin: string;
}

interface ActiveMultiDrag {
  mode: DragMode;
  pointerId: number;
  primaryId: string;
  startClientX: number;
  startClientY: number;
  hasResized: boolean;
  targets: MultiDragTarget[];
  otherRects: DOMRect[];
  rafId: number | null;
}

interface SmartGuideLine {
  type: 'vertical' | 'horizontal';
  pos: number;
  start: number;
  end: number;
  label?: string;
}

function formatBoxShorthand(
  top: string,
  right: string,
  bottom: string,
  left: string
): string {
  const t = Math.round(parseFloat(top) || 0);
  const r = Math.round(parseFloat(right) || 0);
  const b = Math.round(parseFloat(bottom) || 0);
  const l = Math.round(parseFloat(left) || 0);
  if (t === r && r === b && b === l) return `${t}px`;
  if (t === b && r === l) return `${t}px ${r}px`;
  return `${t}px ${r}px ${b}px ${l}px`;
}

/**
 * Returns the active page/slide scope (e.g., `presentation-page-1`, `presentation-season_awards`, or route slug `academy`)
 * and a human-readable label for the current page/slide.
 */
export function getActivePageScopeInfo(el?: HTMLElement | null): {
  scope: string;
  label: string;
  scopeRoot: HTMLElement | null;
} {
  if (typeof document === 'undefined') {
    return { scope: 'page', label: 'Current Page', scopeRoot: null };
  }

  const scopedAncestor = (
    el
      ? el.closest('[data-dev-page-scope]')
      : document.querySelector('[data-dev-page-scope]')
  ) as HTMLElement | null;

  if (scopedAncestor) {
    const scope =
      scopedAncestor.getAttribute('data-dev-page-scope') || 'presentation';
    const label =
      scopedAncestor.getAttribute('data-dev-page-label') || scope;
    return { scope, label, scopeRoot: scopedAncestor };
  }

  const routeSlug =
    typeof window !== 'undefined'
      ? window.location.pathname
          .replace(/[^a-zA-Z0-9]/g, '-')
          .replace(/^-+|-+$/g, '') || 'home'
      : 'page';

  return {
    scope: routeSlug,
    label: `Route /${routeSlug === 'home' ? '' : routeSlug}`,
    scopeRoot: document.body,
  };
}

/**
 * Builds a CSS selector path relative to the nearest `[data-dev-page-scope]` container (or `document.body`).
 * This allows identical structural slots across different presentation pages (e.g. Page 1, Page 2, Page 3)
 * to share the exact same relative selector!
 */
export function buildRelativeSelectorPath(el: HTMLElement): string {
  const parts: string[] = [];
  const { scopeRoot } = getActivePageScopeInfo(el);
  let cur: HTMLElement | null = el;

  while (
    cur &&
    cur !== scopeRoot &&
    cur !== document.body &&
    cur !== document.documentElement
  ) {
    if (cur.id) {
      parts.unshift(`#${CSS.escape(cur.id)}`);
      break;
    }
    const parent: HTMLElement | null = cur.parentElement;
    if (!parent) break;
    const siblings = Array.from(parent.children).filter(
      (child) => !(child as HTMLElement).hasAttribute('data-dev-overlay')
    );
    const idx = siblings.indexOf(cur) + 1;
    parts.unshift(`${cur.tagName.toLowerCase()}:nth-child(${idx})`);
    cur = parent;
  }
  return parts.join(' > ');
}

export function buildCssSelectorPath(el: HTMLElement): string {
  const { scope, scopeRoot } = getActivePageScopeInfo(el);
  const rel = buildRelativeSelectorPath(el);
  if (scopeRoot && scopeRoot.hasAttribute('data-dev-page-scope')) {
    return rel
      ? `[data-dev-page-scope="${CSS.escape(scope)}"] > ${rel}`
      : `[data-dev-page-scope="${CSS.escape(scope)}"]`;
  }
  return rel;
}

export function inferContainerLabel(el: HTMLElement): string {
  const explicitLabel = el.getAttribute('data-dev-label');
  if (explicitLabel) return explicitLabel;

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.slice(0, 32);

  const heading = el.querySelector(
    'h1, h2, h3, h4, h5, [class*="font-black"], [class*="font-bold"]'
  );
  if (heading && heading.textContent) {
    const clean = heading.textContent.trim().replace(/\s+/g, ' ');
    if (clean.length >= 2 && clean.length <= 36) {
      return clean;
    }
    if (clean.length > 36) {
      return clean.slice(0, 32) + '…';
    }
  }

  const tag = el.tagName.toLowerCase();
  const cls = (typeof el.className === 'string' ? el.className : '')
    .split(/\s+/)
    .filter(
      (c) =>
        c &&
        !c.startsWith('outline') &&
        !c.startsWith('ring') &&
        !c.includes(':')
    )
    .slice(0, 2)
    .join('.');

  return cls ? `${tag}.${cls}` : tag;
}

export function ensureElementDevId(el: HTMLElement): string {
  const { scope } = getActivePageScopeInfo(el);
  const existing = el.getAttribute('data-dev-container-id');
  if (existing && existing.startsWith(`${scope}-`)) {
    return existing;
  }

  const relativeSelector = buildRelativeSelectorPath(el);
  const selectorHash = relativeSelector
    .split('')
    .reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0);
  const shortHash = Math.abs(selectorHash).toString(36).slice(0, 6);

  const newId = `${scope}-${el.tagName.toLowerCase()}-${shortHash}`;
  el.setAttribute('data-dev-container-id', newId);
  return newId;
}

export function findBestSelectableContainer(
  rawTarget: HTMLElement | null
): HTMLElement | null {
  if (!rawTarget) return null;
  if (rawTarget.closest('[data-dev-overlay="true"]')) return null;

  // 1. If the element or an ancestor already has a dev container ID, that's an intentional target
  const existingDev = rawTarget.closest('[data-dev-container-id]') as HTMLElement | null;
  if (existingDev && !existingDev.hasAttribute('data-dev-overlay')) {
    return existingDev;
  }

  // 2. Walk upwards to find the most meaningful container or element
  let cur: HTMLElement | null = rawTarget;
  let firstMeasurable: HTMLElement | null = null;
  let structuredCandidate: HTMLElement | null = null;

  while (cur && cur !== document.body && cur !== document.documentElement) {
    if (cur.hasAttribute('data-dev-overlay')) return null;

    const rect = cur.getBoundingClientRect();
    const isMeasurable = rect.width >= 24 && rect.height >= 16;

    if (isMeasurable) {
      if (!firstMeasurable) {
        firstMeasurable = cur;
      }

      const tag = cur.tagName.toLowerCase();
      const cls = typeof cur.className === 'string' ? cur.className : '';
      const parent = cur.parentElement;
      const parentDisplay = parent ? window.getComputedStyle(parent).display : '';
      const isGridOrFlexItem = parentDisplay.includes('grid') || parentDisplay.includes('flex');

      const isSemanticBlock =
        tag === 'section' ||
        tag === 'header' ||
        tag === 'nav' ||
        tag === 'aside' ||
        tag === 'article' ||
        tag === 'main' ||
        tag === 'figure' ||
        tag === 'button' ||
        cls.includes('rounded-') ||
        cls.includes('border') ||
        cls.includes('glass-panel') ||
        cls.includes('bg-') ||
        cls.includes('card') ||
        cls.includes('p-') ||
        cls.includes('px-') ||
        cls.includes('py-') ||
        cls.includes('flex') ||
        cls.includes('grid');

      if (isSemanticBlock && (isGridOrFlexItem || rect.width >= 48)) {
        structuredCandidate = cur;
        break;
      }
    }

    cur = cur.parentElement;
  }

  return structuredCandidate || firstMeasurable;
}

export function getElementMetrics(
  el: HTMLElement,
  saved?: ContainerLayoutConfig
): ElementBoxMetrics {
  const id = ensureElementDevId(el);
  const label = saved?.label || inferContainerLabel(el);
  const rect = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);

  const padding = formatBoxShorthand(
    cs.paddingTop,
    cs.paddingRight,
    cs.paddingBottom,
    cs.paddingLeft
  );
  const margin = formatBoxShorthand(
    cs.marginTop,
    cs.marginRight,
    cs.marginBottom,
    cs.marginLeft
  );

  return {
    id,
    label,
    el,
    top: rect.top,
    left: rect.left,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    padding,
    margin,
    x: saved?.x ?? 0,
    y: saved?.y ?? 0,
    order: saved?.order ?? 0,
    zIndex: saved?.zIndex ?? 0,
    groupId: saved?.groupId,
    overlapFree: saved?.overlapFree,
  };
}

function snapValue(val: number, step: number, enabled: boolean): number {
  if (!enabled || step <= 1) return Math.round(val);
  return Math.round(val / step) * step;
}

/**
 * Helper: Captures all customized (or currently selected) elements on the active page/slide into the Page Clipboard.
 */
export function captureCurrentPageLayoutClipboard(
  layouts: Record<string, ContainerLayoutConfig>,
  selectedIds: string[]
): {
  sourceScope: string;
  sourceLabel: string;
  copiedAt: string;
  items: CopiedItemStyle[];
} | null {
  const { scope, label } = getActivePageScopeInfo();

  const items: CopiedItemStyle[] = [];
  const seenIds = new Set<string>();

  // 1. Include all saved layouts belonging to the current page scope
  for (const cfg of Object.values(layouts)) {
    if (cfg.pageScope === scope || cfg.id.startsWith(`${scope}-`)) {
      const el = document.querySelector(
        `[data-dev-container-id="${CSS.escape(cfg.id)}"]`
      ) as HTMLElement | null;
      const relSel =
        cfg.relativeSelector || (el ? buildRelativeSelectorPath(el) : undefined);
      const idSuffix = cfg.id.startsWith(`${scope}-`)
        ? cfg.id.slice(scope.length + 1)
        : cfg.id;

      items.push({
        sourceId: cfg.id,
        label: cfg.label,
        relativeSelector: relSel,
        idSuffix,
        width: cfg.width,
        height: cfg.height,
        x: cfg.x,
        y: cfg.y,
        order: cfg.order,
        zIndex: cfg.zIndex,
        overlapFree: cfg.overlapFree,
        groupId: cfg.groupId,
      });
      seenIds.add(cfg.id);
    }
  }

  // 2. Also include any currently selected elements (even if not yet resized, captures their current dimensions!)
  for (const selId of selectedIds) {
    if (seenIds.has(selId)) continue;
    const el = document.querySelector(
      `[data-dev-container-id="${CSS.escape(selId)}"]`
    ) as HTMLElement | null;
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const saved = layouts[selId];
    const relSel = buildRelativeSelectorPath(el);
    const idSuffix = selId.startsWith(`${scope}-`)
      ? selId.slice(scope.length + 1)
      : selId;

    items.push({
      sourceId: selId,
      label: saved?.label || inferContainerLabel(el),
      relativeSelector: relSel,
      idSuffix,
      width: saved?.width ?? Math.round(rect.width),
      height: saved?.height ?? Math.round(rect.height),
      x: saved?.x ?? 0,
      y: saved?.y ?? 0,
      order: saved?.order ?? 0,
      zIndex: saved?.zIndex ?? 0,
      overlapFree: saved?.overlapFree,
      groupId: saved?.groupId,
    });
    seenIds.add(selId);
  }

  if (items.length === 0) return null;

  return {
    sourceScope: scope,
    sourceLabel: label,
    copiedAt: new Date().toLocaleTimeString(),
    items,
  };
}

/**
 * Helper: Applies a copied Page Layout Clipboard onto the currently visible page/slide.
 * Matches elements first by exact relative selector path, and falls back to matching grid cards by index.
 */
export function applyPageClipboardToCurrentPage(
  clipboard: {
    sourceScope: string;
    sourceLabel: string;
    items: CopiedItemStyle[];
  },
  updateMultipleContainerLayouts: (
    patches: Record<string, Partial<ContainerLayoutConfig>>
  ) => void
): number {
  const { scope, scopeRoot } = getActivePageScopeInfo();
  if (!scopeRoot) return 0;

  const patches: Record<string, Partial<ContainerLayoutConfig>> = {};
  const unmatchedGridItems: CopiedItemStyle[] = [];
  let appliedCount = 0;

  for (const item of clipboard.items) {
    let targetEl: HTMLElement | null = null;

    if (item.relativeSelector) {
      try {
        targetEl = scopeRoot.querySelector(
          `:scope > ${item.relativeSelector}`
        ) as HTMLElement | null;
      } catch {
        try {
          targetEl = scopeRoot.querySelector(
            item.relativeSelector
          ) as HTMLElement | null;
        } catch {}
      }
    }

    if (targetEl) {
      const targetId = ensureElementDevId(targetEl);
      if (typeof item.width === 'number') {
        targetEl.style.width = `${item.width}px`;
        targetEl.style.maxWidth = 'none';
      }
      if (typeof item.height === 'number') {
        targetEl.style.height = `${item.height}px`;
        targetEl.style.minHeight = `${item.height}px`;
      }
      if (
        (typeof item.x === 'number' && item.x !== 0) ||
        (typeof item.y === 'number' && item.y !== 0)
      ) {
        targetEl.style.transform = `translate3d(${item.x ?? 0}px, ${item.y ?? 0}px, 0)`;
      } else {
        targetEl.style.transform = '';
      }
      if (typeof item.order === 'number' && item.order !== 0) {
        targetEl.style.order = String(item.order);
      }
      if (
        (typeof item.zIndex === 'number' && item.zIndex !== 0) ||
        item.overlapFree
      ) {
        if (window.getComputedStyle(targetEl).position === 'static') {
          targetEl.style.position = 'relative';
        }
        targetEl.style.zIndex = String(item.zIndex || 20);
        if (item.overlapFree && targetEl.parentElement) {
          targetEl.parentElement.style.overflow = 'visible';
        }
      }

      patches[targetId] = {
        label: inferContainerLabel(targetEl),
        selector: buildCssSelectorPath(targetEl),
        relativeSelector: buildRelativeSelectorPath(targetEl),
        pageScope: scope,
        ...(typeof item.width === 'number' ? { width: item.width } : {}),
        ...(typeof item.height === 'number' ? { height: item.height } : {}),
        ...(typeof item.x === 'number' ? { x: item.x } : {}),
        ...(typeof item.y === 'number' ? { y: item.y } : {}),
        ...(typeof item.order === 'number' ? { order: item.order } : {}),
        ...(typeof item.zIndex === 'number' ? { zIndex: item.zIndex } : {}),
        ...(typeof item.overlapFree === 'boolean'
          ? { overlapFree: item.overlapFree }
          : {}),
        ...(item.groupId ? { groupId: `${scope}-${item.groupId}` } : {}),
      };
      appliedCount++;
    } else {
      unmatchedGridItems.push(item);
    }
  }

  // Fallback: If some copied items came from a grid that has a different nesting depth on this page
  // (e.g., copying from Player Dossier Page 1 to Season Awards or Page 3), match visible grid cards by index
  if (unmatchedGridItems.length > 0) {
    const grids = Array.from(
      scopeRoot.querySelectorAll('[class*="grid-cols-"]')
    ) as HTMLElement[];
    // Pick the grid with the most card children
    const primaryGrid = grids.sort(
      (a, b) => b.children.length - a.children.length
    )[0];

    if (primaryGrid) {
      const gridCards = Array.from(primaryGrid.children).filter(
        (c) => !(c as HTMLElement).hasAttribute('data-dev-overlay')
      ) as HTMLElement[];

      unmatchedGridItems.forEach((item, idx) => {
        const cardEl = gridCards[idx];
        if (!cardEl) return;
        const targetId = ensureElementDevId(cardEl);
        if (patches[targetId]) return;

        if (typeof item.width === 'number') {
          cardEl.style.width = `${item.width}px`;
          cardEl.style.maxWidth = 'none';
        }
        if (typeof item.height === 'number') {
          cardEl.style.height = `${item.height}px`;
          cardEl.style.minHeight = `${item.height}px`;
        }
        if (
          (typeof item.x === 'number' && item.x !== 0) ||
          (typeof item.y === 'number' && item.y !== 0)
        ) {
          cardEl.style.transform = `translate3d(${item.x ?? 0}px, ${item.y ?? 0}px, 0)`;
        }

        patches[targetId] = {
          label: inferContainerLabel(cardEl),
          selector: buildCssSelectorPath(cardEl),
          relativeSelector: buildRelativeSelectorPath(cardEl),
          pageScope: scope,
          ...(typeof item.width === 'number' ? { width: item.width } : {}),
          ...(typeof item.height === 'number' ? { height: item.height } : {}),
          ...(typeof item.x === 'number' ? { x: item.x } : {}),
          ...(typeof item.y === 'number' ? { y: item.y } : {}),
        };
        appliedCount++;
      });
    }
  }

  if (appliedCount > 0) {
    updateMultipleContainerLayouts(patches);
  }
  return appliedCount;
}

export default function DevUniversalInspector() {
  const {
    isDevMode,
    layouts,
    selectedIds,
    lastUngroupedIds,
    interactionMode,
    snapSettings,
    copiedPageClipboard,
    copiedSelectionClipboard,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    undo,
    redo,
    setSelectedContainer,
    setSelectedContainers,
    groupSelectedContainers,
    ungroupSelectedContainers,
    regroupContainers,
    setCopiedPageClipboard,
    setCopiedSelectionClipboard,
    cloneScopeLayoutToScopes,
    updateSnapSettings,
    updateMultipleContainerLayouts,
    resetContainerLayout,
  } = useDevModeStore();

  const [hoveredBox, setHoveredBox] = useState<ElementBoxMetrics | null>(null);
  const [selectedBoxes, setSelectedBoxes] = useState<ElementBoxMetrics[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [smartGuides, setSmartGuides] = useState<SmartGuideLine[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Hovering MS Office Arrange Menu state
  const [menuPinnedPos, setMenuPinnedPos] = useState<{ x: number; y: number } | null>(null);
  const [activeMenuTab, setActiveMenuTab] = useState<
    'arrange' | 'align' | 'snap' | 'pagecopy'
  >('arrange');
  const menuDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const dragRef = useRef<ActiveMultiDrag | null>(null);
  const boxOverlayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const badgeDimsRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const badgeCoordsRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const showTempFeedback = useCallback((msg: string) => {
    setCopyFeedback(msg);
    window.setTimeout(() => {
      setCopyFeedback((prev) => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  // Re-apply saved layouts strictly to their matching page/slide scope
  const applySavedStylesToDom = useCallback(() => {
    if (typeof document === 'undefined') return;
    const { scope: activeScope, scopeRoot } = getActivePageScopeInfo();

    for (const [id, cfg] of Object.entries(layouts)) {
      // Only apply styles that belong to the currently active page/slide scope (or legacy unscoped entries)
      if (
        cfg.pageScope &&
        cfg.pageScope !== activeScope &&
        !id.startsWith(`${activeScope}-`)
      ) {
        continue;
      }

      let el = document.querySelector(
        `[data-dev-container-id="${CSS.escape(id)}"]`
      ) as HTMLElement | null;

      if (!el && cfg.relativeSelector && scopeRoot) {
        try {
          el = scopeRoot.querySelector(
            `:scope > ${cfg.relativeSelector}`
          ) as HTMLElement | null;
          if (el) {
            el.setAttribute('data-dev-container-id', id);
          }
        } catch {}
      }

      if (!el && cfg.selector) {
        try {
          el = document.querySelector(cfg.selector) as HTMLElement | null;
          if (el) {
            el.setAttribute('data-dev-container-id', id);
          }
        } catch {}
      }

      if (!el || dragRef.current) continue;

      if (cfg.groupId) {
        el.setAttribute('data-dev-group-id', cfg.groupId);
      } else {
        el.removeAttribute('data-dev-group-id');
      }

      if (typeof cfg.width === 'number') {
        el.style.width = `${cfg.width}px`;
        el.style.maxWidth = 'none';
      } else {
        el.style.width = '';
        el.style.maxWidth = '';
      }

      if (typeof cfg.height === 'number') {
        el.style.height = `${cfg.height}px`;
        el.style.minHeight = `${cfg.height}px`;
      } else {
        el.style.height = '';
        el.style.minHeight = '';
      }

      if (
        (typeof cfg.x === 'number' && cfg.x !== 0) ||
        (typeof cfg.y === 'number' && cfg.y !== 0)
      ) {
        const cs = window.getComputedStyle(el);
        if (cs.position === 'static') {
          el.style.position = 'relative';
        }
        el.style.transform = `translate3d(${cfg.x ?? 0}px, ${cfg.y ?? 0}px, 0)`;
      } else {
        el.style.transform = '';
      }

      if (typeof cfg.order === 'number' && cfg.order !== 0) {
        el.style.order = String(cfg.order);
      } else {
        el.style.order = '';
      }

      if (
        (typeof cfg.zIndex === 'number' && cfg.zIndex !== 0) ||
        cfg.overlapFree
      ) {
        const cs = window.getComputedStyle(el);
        if (cs.position === 'static') {
          el.style.position = 'relative';
        }
        el.style.zIndex = String(
          typeof cfg.zIndex === 'number' && cfg.zIndex !== 0 ? cfg.zIndex : 20
        );
        if (cfg.overlapFree && el.parentElement) {
          el.parentElement.style.overflow = 'visible';
        }
      } else {
        el.style.zIndex = '';
      }
    }
  }, [layouts]);

  // Measure all currently selected elements so their floating bounding boxes stay locked to viewport coordinates
  const refreshSelectedBoxes = useCallback(() => {
    if (typeof document === 'undefined' || !isDevMode) {
      setSelectedBoxes([]);
      return;
    }

    const { scope: activeScope, scopeRoot } = getActivePageScopeInfo();
    const nextBoxes: ElementBoxMetrics[] = [];

    for (const id of selectedIds) {
      let el = document.querySelector(
        `[data-dev-container-id="${CSS.escape(id)}"]`
      ) as HTMLElement | null;

      const saved = layouts[id];
      if (!el && saved?.relativeSelector && scopeRoot) {
        try {
          el = scopeRoot.querySelector(
            `:scope > ${saved.relativeSelector}`
          ) as HTMLElement | null;
          if (el) el.setAttribute('data-dev-container-id', ensureElementDevId(el));
        } catch {}
      }

      if (!el && saved?.selector) {
        try {
          el = document.querySelector(saved.selector) as HTMLElement | null;
          if (el) el.setAttribute('data-dev-container-id', id);
        } catch {}
      }

      if (el) {
        const currentScopedId = ensureElementDevId(el);
        nextBoxes.push(
          getElementMetrics(el, layouts[currentScopedId] || saved)
        );
      }
    }
    setSelectedBoxes(nextBoxes);
  }, [isDevMode, selectedIds, layouts]);

  useEffect(() => {
    applySavedStylesToDom();
    refreshSelectedBoxes();
  }, [applySavedStylesToDom, refreshSelectedBoxes]);

  const unionBounds = useMemo(() => {
    if (selectedBoxes.length === 0) return null;
    let minTop = Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    for (const b of selectedBoxes) {
      minTop = Math.min(minTop, b.top);
      minLeft = Math.min(minLeft, b.left);
      maxRight = Math.max(maxRight, b.left + b.width);
      maxBottom = Math.max(maxBottom, b.top + b.height);
    }

    const activeGroupIds = Array.from(
      new Set(selectedBoxes.map((b) => b.groupId).filter(Boolean))
    );

    return {
      top: minTop,
      left: minLeft,
      width: Math.max(0, maxRight - minLeft),
      height: Math.max(0, maxBottom - minTop),
      centerX: (minLeft + maxRight) / 2,
      centerY: (minTop + maxBottom) / 2,
      groupId: activeGroupIds.length === 1 ? activeGroupIds[0] : undefined,
      hasAnyGrouped: activeGroupIds.length > 0,
    };
  }, [selectedBoxes]);

  useEffect(() => {
    if (!isDevMode) return;

    let raf = 0;
    const syncOnScrollOrResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        applySavedStylesToDom();
        refreshSelectedBoxes();
      });
    };

    const handleGlobalReset = () => {
      const allTagged = document.querySelectorAll('[data-dev-container-id]');
      allTagged.forEach((node) => {
        const htmlEl = node as HTMLElement;
        htmlEl.style.width = '';
        htmlEl.style.maxWidth = '';
        htmlEl.style.height = '';
        htmlEl.style.minHeight = '';
        htmlEl.style.transform = '';
        htmlEl.style.order = '';
        htmlEl.style.zIndex = '';
        htmlEl.style.position = '';
        htmlEl.removeAttribute('data-dev-group-id');
      });
      requestAnimationFrame(refreshSelectedBoxes);
    };

    window.addEventListener('scroll', syncOnScrollOrResize, {
      passive: true,
      capture: true,
    });
    window.addEventListener('resize', syncOnScrollOrResize, { passive: true });
    window.addEventListener('ept_dev_layout_reset', handleGlobalReset);
    window.addEventListener('ept_dev_refresh_boxes', syncOnScrollOrResize);

    let mutRaf = 0;
    const observer = new MutationObserver((mutations) => {
      if (dragRef.current) return;
      const hasExternalChildChange = mutations.some(
        (m) =>
          m.type === 'childList' &&
          m.target instanceof HTMLElement &&
          !m.target.closest('[data-dev-overlay="true"]')
      );
      if (!hasExternalChildChange) return;

      if (mutRaf) cancelAnimationFrame(mutRaf);
      mutRaf = requestAnimationFrame(() => {
        applySavedStylesToDom();
        refreshSelectedBoxes();
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (mutRaf) cancelAnimationFrame(mutRaf);
      observer.disconnect();
      window.removeEventListener('scroll', syncOnScrollOrResize, {
        capture: true,
      });
      window.removeEventListener('resize', syncOnScrollOrResize);
      window.removeEventListener('ept_dev_layout_reset', handleGlobalReset);
      window.removeEventListener('ept_dev_refresh_boxes', syncOnScrollOrResize);
    };
  }, [isDevMode, applySavedStylesToDom, refreshSelectedBoxes]);

  // Global Hover, Click-to-Select, and Right-Click Context Menu
  useEffect(() => {
    if (!isDevMode || interactionMode !== 'select') {
      setHoveredBox(null);
      return;
    }

    let hoverRaf = 0;
    const handlePointerMovePage = (e: PointerEvent) => {
      if (dragRef.current || menuDragRef.current) return;
      if (hoverRaf) cancelAnimationFrame(hoverRaf);
      hoverRaf = requestAnimationFrame(() => {
        const target = e.target as HTMLElement | null;
        if (!target || target.closest('[data-dev-overlay="true"]')) {
          setHoveredBox(null);
          return;
        }
        const best = findBestSelectableContainer(target);
        if (!best) {
          setHoveredBox(null);
          return;
        }
        const id = ensureElementDevId(best);
        if (selectedIds.includes(id)) {
          setHoveredBox(null);
          return;
        }
        setHoveredBox(getElementMetrics(best, layouts[id]));
      });
    };

    const handleClickCapturePage = (e: MouseEvent) => {
      if (dragRef.current || menuDragRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target || target.closest('[data-dev-overlay="true"]')) {
        return;
      }

      const best = findBestSelectableContainer(target);
      if (!best) return;

      e.preventDefault();
      e.stopPropagation();

      const id = ensureElementDevId(best);
      const isAdditive = e.shiftKey || e.ctrlKey || e.metaKey;

      // If the clicked element is already the solely selected container, drill into its clicked child
      if (selectedIds.length === 1 && selectedIds[0] === id && target !== best) {
        const deeper = findBestSelectableContainer(target);
        if (deeper && deeper !== best) {
          const childId = ensureElementDevId(deeper);
          setSelectedContainer(childId, isAdditive);
          setHoveredBox(null);
          return;
        }
      }

      setSelectedContainer(id, isAdditive);
      setHoveredBox(null);
    };

    const handleContextMenuPage = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest('[data-dev-overlay="true"]')) return;

      const best = findBestSelectableContainer(target);
      if (!best) return;

      e.preventDefault();
      e.stopPropagation();

      const id = ensureElementDevId(best);
      if (!selectedIds.includes(id)) {
        setSelectedContainer(id, e.shiftKey || e.ctrlKey || e.metaKey);
      }
      setMenuPinnedPos({
        x: Math.min(window.innerWidth - 590, Math.max(16, e.clientX - 220)),
        y: Math.min(window.innerHeight - 230, Math.max(16, e.clientY - 100)),
      });
    };

    window.addEventListener('pointermove', handlePointerMovePage, {
      passive: true,
    });
    window.addEventListener('click', handleClickCapturePage, { capture: true });
    window.addEventListener('contextmenu', handleContextMenuPage, {
      capture: true,
    });

    return () => {
      if (hoverRaf) cancelAnimationFrame(hoverRaf);
      window.removeEventListener('pointermove', handlePointerMovePage);
      window.removeEventListener('click', handleClickCapturePage, {
        capture: true,
      });
      window.removeEventListener('contextmenu', handleContextMenuPage, {
        capture: true,
      });
    };
  }, [isDevMode, interactionMode, selectedIds, layouts, setSelectedContainer]);

  // Select All Siblings in the Same Grid / Flex Parent
  const handleSelectSiblings = useCallback(
    (targetEl?: HTMLElement) => {
      const el = targetEl || selectedBoxes[0]?.el;
      if (!el) return;
      const parent = el.parentElement;
      if (!parent) return;

      const siblingIds: string[] = [];
      Array.from(parent.children).forEach((child) => {
        const htmlChild = child as HTMLElement;
        if (htmlChild.hasAttribute('data-dev-overlay')) return;
        const rect = htmlChild.getBoundingClientRect();
        if (rect.width >= 40 && rect.height >= 24) {
          siblingIds.push(ensureElementDevId(htmlChild));
        }
      });

      if (siblingIds.length > 0) {
        setSelectedContainers(siblingIds);
      }
    },
    [selectedBoxes, setSelectedContainers]
  );

  // Select All Containers/Elements on Current Page or Scope (`Ctrl + A`)
  const handleSelectAllOnPage = useCallback(() => {
    if (typeof document === 'undefined') return;
    const { scopeRoot } = getActivePageScopeInfo();
    const root = scopeRoot || document.body;

    const allSelectable = root.querySelectorAll(
      'section, article, header, nav, aside, figure, [class*="card"], [class*="rounded-"], [class*="glass-panel"], [class*="border"], [class*="grid-cols-"] > div, [class*="flex"] > div, [data-dev-container-id]'
    );

    const gatheredIds = new Set<string>();
    allSelectable.forEach((node) => {
      const htmlNode = node as HTMLElement;
      if (htmlNode.closest('[data-dev-overlay="true"]')) return;
      if (htmlNode === root || htmlNode === document.body) return;

      const rect = htmlNode.getBoundingClientRect();
      if (rect.width >= 36 && rect.height >= 20 && rect.bottom > 0 && rect.top < window.innerHeight) {
        gatheredIds.add(ensureElementDevId(htmlNode));
      }
    });

    if (gatheredIds.size > 0) {
      setSelectedContainers(Array.from(gatheredIds));
      showTempFeedback(`Selected all ${gatheredIds.size} elements`);
    }
  }, [setSelectedContainers, showTempFeedback]);

  // Select Direct Meaningful Child Elements ("Drill In")
  const handleSelectChildren = useCallback((targetEl?: HTMLElement) => {
    const el = targetEl || selectedBoxes[0]?.el;
    if (!el) return;

    const childCandidates = Array.from(el.children).filter(
      (c) => !(c as HTMLElement).hasAttribute('data-dev-overlay')
    ) as HTMLElement[];

    const childIds: string[] = [];
    childCandidates.forEach((child) => {
      const best = findBestSelectableContainer(child) || child;
      const rect = best.getBoundingClientRect();
      if (rect.width >= 30 && rect.height >= 18) {
        childIds.push(ensureElementDevId(best));
      }
    });

    if (childIds.length > 0) {
      setSelectedContainers(Array.from(new Set(childIds)));
      showTempFeedback(`Drilled into ${childIds.length} child element(s)`);
    } else {
      showTempFeedback('No deeper child containers found');
    }
  }, [selectedBoxes, setSelectedContainers, showTempFeedback]);

  // Select Parent Container ("Drill Out")
  const handleSelectParent = (targetEl?: HTMLElement) => {
    const el = targetEl || selectedBoxes[0]?.el;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent || parent === document.body) return;
    const parentContainer = findBestSelectableContainer(parent) || parent;
    const parentId = ensureElementDevId(parentContainer);
    setSelectedContainers([parentId]);
    showTempFeedback('Selected parent container');
  };

  // Copy Selected Elements' Style (`Ctrl+Shift+C`)
  const handleCopySelectedStyle = useCallback(() => {
    if (selectedBoxes.length === 0) return;
    const { scope } = getActivePageScopeInfo();
    const items: CopiedItemStyle[] = selectedBoxes.map((b) => {
      const saved = layouts[b.id];
      return {
        sourceId: b.id,
        label: b.label,
        relativeSelector: buildRelativeSelectorPath(b.el),
        idSuffix: b.id.startsWith(`${scope}-`)
          ? b.id.slice(scope.length + 1)
          : b.id,
        width: saved?.width ?? b.width,
        height: saved?.height ?? b.height,
        x: saved?.x ?? 0,
        y: saved?.y ?? 0,
        order: saved?.order ?? 0,
        zIndex: saved?.zIndex ?? 0,
        overlapFree: saved?.overlapFree,
      };
    });
    setCopiedSelectionClipboard(items);
    showTempFeedback(`Copied ${items.length} item style(s)`);
  }, [selectedBoxes, layouts, setCopiedSelectionClipboard, showTempFeedback]);

  // Paste Copied Selection Style onto Currently Selected Elements (`Ctrl+Shift+V`)
  const handlePasteSelectedStyle = useCallback(
    (includePosition = false) => {
      if (
        !copiedSelectionClipboard ||
        copiedSelectionClipboard.length === 0 ||
        selectedBoxes.length === 0
      ) {
        return;
      }

      const { scope } = getActivePageScopeInfo();
      const patches: Record<string, Partial<ContainerLayoutConfig>> = {};

      selectedBoxes.forEach((box, idx) => {
        const src =
          copiedSelectionClipboard[idx] || copiedSelectionClipboard[0];
        if (!src) return;

        if (typeof src.width === 'number') {
          box.el.style.width = `${src.width}px`;
          box.el.style.maxWidth = 'none';
        }
        if (typeof src.height === 'number') {
          box.el.style.height = `${src.height}px`;
          box.el.style.minHeight = `${src.height}px`;
        }
        if (includePosition) {
          const nx = src.x ?? 0;
          const ny = src.y ?? 0;
          box.el.style.transform =
            nx !== 0 || ny !== 0 ? `translate3d(${nx}px, ${ny}px, 0)` : '';
        }

        patches[box.id] = {
          label: box.label,
          selector: buildCssSelectorPath(box.el),
          relativeSelector: buildRelativeSelectorPath(box.el),
          pageScope: scope,
          ...(typeof src.width === 'number' ? { width: src.width } : {}),
          ...(typeof src.height === 'number' ? { height: src.height } : {}),
          ...(includePosition
            ? { x: src.x ?? 0, y: src.y ?? 0, zIndex: src.zIndex ?? 0 }
            : {}),
        };
      });

      updateMultipleContainerLayouts(patches);
      requestAnimationFrame(refreshSelectedBoxes);
      showTempFeedback(`Pasted style to ${selectedBoxes.length} item(s)`);
    },
    [
      copiedSelectionClipboard,
      selectedBoxes,
      updateMultipleContainerLayouts,
      refreshSelectedBoxes,
      showTempFeedback,
    ]
  );

  // Copy Entire Current Page / Slide Layout Snapshot
  const handleCopyCurrentPageLayout = useCallback(() => {
    const clip = captureCurrentPageLayoutClipboard(layouts, selectedIds);
    if (!clip) {
      showTempFeedback('Resize or select items on this page first');
      return;
    }
    setCopiedPageClipboard(clip);
    showTempFeedback(
      `Copied ${clip.items.length} layout(s) from ${clip.sourceLabel}`
    );
  }, [layouts, selectedIds, setCopiedPageClipboard, showTempFeedback]);

  // Paste Copied Page Layout onto the Current Page / Slide
  const handlePastePageLayoutHere = useCallback(() => {
    if (!copiedPageClipboard) return;
    const count = applyPageClipboardToCurrentPage(
      copiedPageClipboard,
      updateMultipleContainerLayouts
    );
    requestAnimationFrame(refreshSelectedBoxes);
    showTempFeedback(
      count > 0
        ? `Applied ${count} layout(s) to this page!`
        : 'No matching containers found on this page'
    );
  }, [
    copiedPageClipboard,
    updateMultipleContainerLayouts,
    refreshSelectedBoxes,
    showTempFeedback,
  ]);

  // 1-Click Clone Current Presentation Page Layout to Target Presentation Pages
  const handleCloneToPresentationScopes = (targetScopes: string[], label: string) => {
    const { scope } = getActivePageScopeInfo();
    const clip = captureCurrentPageLayoutClipboard(layouts, selectedIds);
    cloneScopeLayoutToScopes(scope, targetScopes, clip?.items);
    showTempFeedback(`Cloned layout to ${label}!`);
  };

  // MS Office Layering Commands: Bring to Front, Bring Forward, Send Backward, Send to Back
  const handleLayerCommand = useCallback(
    (action: 'front' | 'forward' | 'backward' | 'back') => {
      if (selectedBoxes.length === 0) return;
      const { scope } = getActivePageScopeInfo();

      let maxZ = 10;
      let minZ = 0;
      for (const cfg of Object.values(layouts)) {
        if (typeof cfg.zIndex === 'number') {
          maxZ = Math.max(maxZ, cfg.zIndex);
          minZ = Math.min(minZ, cfg.zIndex);
        }
      }

      const patches: Record<string, Partial<ContainerLayoutConfig>> = {};
      for (const box of selectedBoxes) {
        const curZ = layouts[box.id]?.zIndex ?? 0;
        let nextZ = curZ;
        if (action === 'front') nextZ = Math.max(maxZ + 10, 30);
        else if (action === 'forward') nextZ = curZ + 5;
        else if (action === 'backward') nextZ = curZ - 5;
        else if (action === 'back') nextZ = Math.min(minZ - 5, -5);

        const cs = window.getComputedStyle(box.el);
        if (cs.position === 'static') {
          box.el.style.position = 'relative';
        }
        box.el.style.zIndex = String(nextZ);
        if (box.el.parentElement) {
          box.el.parentElement.style.overflow = 'visible';
        }

        patches[box.id] = {
          label: box.label,
          selector: buildCssSelectorPath(box.el),
          relativeSelector: buildRelativeSelectorPath(box.el),
          pageScope: scope,
          zIndex: nextZ,
          overlapFree: true,
          computedPadding: box.padding,
          computedMargin: box.margin,
        };
      }

      updateMultipleContainerLayouts(patches);
      requestAnimationFrame(refreshSelectedBoxes);
    },
    [selectedBoxes, layouts, updateMultipleContainerLayouts, refreshSelectedBoxes]
  );

  const handleToggleOverlapFree = () => {
    if (selectedBoxes.length === 0) return;
    const { scope } = getActivePageScopeInfo();
    const allOverlap = selectedBoxes.every((b) => layouts[b.id]?.overlapFree);
    const nextOverlap = !allOverlap;

    const patches: Record<string, Partial<ContainerLayoutConfig>> = {};
    for (const box of selectedBoxes) {
      const curZ = layouts[box.id]?.zIndex ?? 0;
      const nextZ = nextOverlap ? (curZ > 0 ? curZ : 25) : 0;

      if (nextOverlap) {
        if (window.getComputedStyle(box.el).position === 'static') {
          box.el.style.position = 'relative';
        }
        box.el.style.zIndex = String(nextZ);
        if (box.el.parentElement) {
          box.el.parentElement.style.overflow = 'visible';
        }
      } else {
        box.el.style.zIndex = '';
      }

      patches[box.id] = {
        label: box.label,
        selector: buildCssSelectorPath(box.el),
        relativeSelector: buildRelativeSelectorPath(box.el),
        pageScope: scope,
        overlapFree: nextOverlap,
        zIndex: nextZ,
      };
    }

    updateMultipleContainerLayouts(patches);
    requestAnimationFrame(refreshSelectedBoxes);
  };

  const handleAlignSelected = (
    mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ) => {
    if (selectedBoxes.length < 2 || !unionBounds) return;
    const { scope } = getActivePageScopeInfo();

    const patches: Record<string, Partial<ContainerLayoutConfig>> = {};
    for (const box of selectedBoxes) {
      const curX = layouts[box.id]?.x ?? 0;
      const curY = layouts[box.id]?.y ?? 0;
      let nextX = curX;
      let nextY = curY;

      if (mode === 'left') {
        nextX = Math.round(curX + (unionBounds.left - box.left));
      } else if (mode === 'center') {
        const boxCenterX = box.left + box.width / 2;
        nextX = Math.round(curX + (unionBounds.centerX - boxCenterX));
      } else if (mode === 'right') {
        const unionRight = unionBounds.left + unionBounds.width;
        const boxRight = box.left + box.width;
        nextX = Math.round(curX + (unionRight - boxRight));
      } else if (mode === 'top') {
        nextY = Math.round(curY + (unionBounds.top - box.top));
      } else if (mode === 'middle') {
        const boxCenterY = box.top + box.height / 2;
        nextY = Math.round(curY + (unionBounds.centerY - boxCenterY));
      } else if (mode === 'bottom') {
        const unionBottom = unionBounds.top + unionBounds.height;
        const boxBottom = box.top + box.height;
        nextY = Math.round(curY + (unionBottom - boxBottom));
      }

      box.el.style.transform =
        nextX !== 0 || nextY !== 0
          ? `translate3d(${nextX}px, ${nextY}px, 0)`
          : '';

      patches[box.id] = {
        label: box.label,
        selector: buildCssSelectorPath(box.el),
        relativeSelector: buildRelativeSelectorPath(box.el),
        pageScope: scope,
        x: nextX,
        y: nextY,
        computedPadding: box.padding,
        computedMargin: box.margin,
      };
    }

    updateMultipleContainerLayouts(patches);
    requestAnimationFrame(refreshSelectedBoxes);
  };

  const handleDistributeSelected = (axis: 'horizontal' | 'vertical') => {
    if (selectedBoxes.length < 3) return;
    const { scope } = getActivePageScopeInfo();

    const sorted = [...selectedBoxes].sort((a, b) =>
      axis === 'horizontal' ? a.left - b.left : a.top - b.top
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const patches: Record<string, Partial<ContainerLayoutConfig>> = {};

    if (axis === 'horizontal') {
      const totalSpan = last.left + last.width - first.left;
      const totalItemsWidth = sorted.reduce((acc, b) => acc + b.width, 0);
      const gap = (totalSpan - totalItemsWidth) / (sorted.length - 1);

      let cursorLeft = first.left;
      for (const box of sorted) {
        const curX = layouts[box.id]?.x ?? 0;
        const nextX = Math.round(curX + (cursorLeft - box.left));
        const curY = layouts[box.id]?.y ?? 0;
        box.el.style.transform =
          nextX !== 0 || curY !== 0
            ? `translate3d(${nextX}px, ${curY}px, 0)`
            : '';
        patches[box.id] = {
          label: box.label,
          selector: buildCssSelectorPath(box.el),
          relativeSelector: buildRelativeSelectorPath(box.el),
          pageScope: scope,
          x: nextX,
        };
        cursorLeft += box.width + gap;
      }
    } else {
      const totalSpan = last.top + last.height - first.top;
      const totalItemsHeight = sorted.reduce((acc, b) => acc + b.height, 0);
      const gap = (totalSpan - totalItemsHeight) / (sorted.length - 1);

      let cursorTop = first.top;
      for (const box of sorted) {
        const curX = layouts[box.id]?.x ?? 0;
        const curY = layouts[box.id]?.y ?? 0;
        const nextY = Math.round(curY + (cursorTop - box.top));
        box.el.style.transform =
          curX !== 0 || nextY !== 0
            ? `translate3d(${curX}px, ${nextY}px, 0)`
            : '';
        patches[box.id] = {
          label: box.label,
          selector: buildCssSelectorPath(box.el),
          relativeSelector: buildRelativeSelectorPath(box.el),
          pageScope: scope,
          y: nextY,
        };
        cursorTop += box.height + gap;
      }
    }

    updateMultipleContainerLayouts(patches);
    requestAnimationFrame(refreshSelectedBoxes);
  };

  const handleMatchDimensions = (mode: 'width' | 'height' | 'both') => {
    if (selectedBoxes.length < 2) return;
    const { scope } = getActivePageScopeInfo();
    const primary = selectedBoxes[0];
    const targetW = layouts[primary.id]?.width ?? primary.width;
    const targetH = layouts[primary.id]?.height ?? primary.height;

    const patches: Record<string, Partial<ContainerLayoutConfig>> = {};
    for (const box of selectedBoxes) {
      const patch: Partial<ContainerLayoutConfig> = {
        label: box.label,
        selector: buildCssSelectorPath(box.el),
        relativeSelector: buildRelativeSelectorPath(box.el),
        pageScope: scope,
      };
      if (mode === 'width' || mode === 'both') {
        box.el.style.width = `${targetW}px`;
        box.el.style.maxWidth = 'none';
        patch.width = targetW;
      }
      if (mode === 'height' || mode === 'both') {
        box.el.style.height = `${targetH}px`;
        box.el.style.minHeight = `${targetH}px`;
        patch.height = targetH;
      }
      patches[box.id] = patch;
    }

    updateMultipleContainerLayouts(patches);
    requestAnimationFrame(refreshSelectedBoxes);
  };

  const handleNudgeSelected = useCallback(
    (dx: number, dy: number) => {
      if (selectedBoxes.length === 0) return;
      const { scope } = getActivePageScopeInfo();
      const patches: Record<string, Partial<ContainerLayoutConfig>> = {};
      for (const box of selectedBoxes) {
        const curX = layouts[box.id]?.x ?? 0;
        const curY = layouts[box.id]?.y ?? 0;
        const nextX = Math.round(curX + dx);
        const nextY = Math.round(curY + dy);
        box.el.style.transform =
          nextX !== 0 || nextY !== 0
            ? `translate3d(${nextX}px, ${nextY}px, 0)`
            : '';
        patches[box.id] = {
          label: box.label,
          selector: buildCssSelectorPath(box.el),
          relativeSelector: buildRelativeSelectorPath(box.el),
          pageScope: scope,
          x: nextX,
          y: nextY,
        };
      }
      updateMultipleContainerLayouts(patches);
      requestAnimationFrame(refreshSelectedBoxes);
    },
    [selectedBoxes, layouts, updateMultipleContainerLayouts, refreshSelectedBoxes]
  );

  // Keyboard Arrow Nudge, Z-Order (`[`, `]`), & Copy/Paste Style (`Ctrl+Shift+C` / `Ctrl+Shift+V`)
  useEffect(() => {
    if (!isDevMode) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAllOnPage();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelectedStyle();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteSelectedStyle(false);
        return;
      }

      if (selectedBoxes.length === 0) return;

      const step = e.shiftKey
        ? 1
        : snapSettings.snapToGrid
          ? snapSettings.gridSize
          : 4;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNudgeSelected(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNudgeSelected(step, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNudgeSelected(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNudgeSelected(0, step);
      } else if (e.key === ']') {
        e.preventDefault();
        handleLayerCommand(e.shiftKey ? 'front' : 'forward');
      } else if (e.key === '[') {
        e.preventDefault();
        handleLayerCommand(e.shiftKey ? 'back' : 'backward');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isDevMode,
    selectedBoxes.length,
    snapSettings.snapToGrid,
    snapSettings.gridSize,
    handleNudgeSelected,
    handleLayerCommand,
    handleCopySelectedStyle,
    handlePasteSelectedStyle,
  ]);

  const handleAdjustOrderMulti = (delta: number) => {
    const { scope } = getActivePageScopeInfo();
    const patches: Record<string, Partial<ContainerLayoutConfig>> = {};
    for (const box of selectedBoxes) {
      const curOrder = layouts[box.id]?.order ?? 0;
      const nextOrder = curOrder + delta;
      box.el.style.order = nextOrder !== 0 ? String(nextOrder) : '';
      patches[box.id] = {
        label: box.label,
        selector: buildCssSelectorPath(box.el),
        relativeSelector: buildRelativeSelectorPath(box.el),
        pageScope: scope,
        order: nextOrder,
        computedPadding: box.padding,
        computedMargin: box.margin,
      };
    }
    updateMultipleContainerLayouts(patches);
    requestAnimationFrame(refreshSelectedBoxes);
  };

  const handleResetSingle = (box: ElementBoxMetrics) => {
    box.el.style.width = '';
    box.el.style.maxWidth = '';
    box.el.style.height = '';
    box.el.style.minHeight = '';
    box.el.style.transform = '';
    box.el.style.order = '';
    box.el.style.zIndex = '';
    box.el.style.position = '';
    box.el.removeAttribute('data-dev-group-id');
    resetContainerLayout(box.id);
    requestAnimationFrame(refreshSelectedBoxes);
  };

  const handlePointerDownOverlay = (
    e: React.PointerEvent<HTMLElement>,
    primaryBox: ElementBoxMetrics,
    mode: DragMode
  ) => {
    if (!isDevMode || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const activeBoxes = selectedBoxes.some((b) => b.id === primaryBox.id)
      ? selectedBoxes
      : [primaryBox];

    const activeEls = new Set(activeBoxes.map((b) => b.el));
    const { scope } = getActivePageScopeInfo(primaryBox.el);

    const otherRects: DOMRect[] = [];
    if (snapSettings.snapToObjects) {
      const candidates = document.querySelectorAll(
        '[data-dev-container-id], section, article, [class*="rounded-"], [class*="glass-panel"]'
      );
      candidates.forEach((node) => {
        const htmlNode = node as HTMLElement;
        if (
          activeEls.has(htmlNode) ||
          htmlNode.closest('[data-dev-overlay="true"]')
        ) {
          return;
        }
        const r = htmlNode.getBoundingClientRect();
        if (
          r.width >= 60 &&
          r.height >= 28 &&
          r.bottom > 0 &&
          r.top < window.innerHeight
        ) {
          otherRects.push(r);
        }
      });
    }

    const targets: MultiDragTarget[] = activeBoxes.map((b) => {
      const saved = layouts[b.id];
      const rect = b.el.getBoundingClientRect();
      const startW =
        typeof saved?.width === 'number' ? saved.width : Math.round(rect.width);
      const startH =
        typeof saved?.height === 'number'
          ? saved.height
          : Math.round(rect.height);
      const startX = typeof saved?.x === 'number' ? saved.x : 0;
      const startY = typeof saved?.y === 'number' ? saved.y : 0;

      return {
        id: b.id,
        label: b.label,
        selector: buildCssSelectorPath(b.el),
        relativeSelector: buildRelativeSelectorPath(b.el),
        pageScope: scope,
        el: b.el,
        startRectTop: rect.top,
        startRectLeft: rect.left,
        startWidth: startW,
        startHeight: startH,
        startX,
        startY,
        curWidth: startW,
        curHeight: startH,
        curX: startX,
        curY: startY,
        padding: b.padding,
        margin: b.margin,
      };
    });

    dragRef.current = {
      mode,
      pointerId: e.pointerId,
      primaryId: primaryBox.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      hasResized: mode !== 'move',
      targets,
      otherRects: otherRects.slice(0, 60),
      rafId: null,
    };

    setIsDragging(true);
    setHoveredBox(null);
  };

  const handlePointerMoveOverlay = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    e.preventDefault();
    e.stopPropagation();

    const useGridSnap = snapSettings.snapToGrid && !e.altKey;
    const useObjectSnap = snapSettings.snapToObjects && !e.altKey;
    const step = snapSettings.gridSize;

    let dx = e.clientX - drag.startClientX;
    let dy = e.clientY - drag.startClientY;

    if (useGridSnap) {
      dx = snapValue(dx, step, true);
      dy = snapValue(dy, step, true);
    }

    const activeGuides: SmartGuideLine[] = [];
    const primaryTarget =
      drag.targets.find((t) => t.id === drag.primaryId) || drag.targets[0];

    if (useObjectSnap && primaryTarget && drag.otherRects.length > 0) {
      const SNAP_THRESHOLD = 6;
      const candLeft =
        drag.mode === 'move'
          ? primaryTarget.startRectLeft + dx
          : primaryTarget.startRectLeft;
      const candTop =
        drag.mode === 'move'
          ? primaryTarget.startRectTop + dy
          : primaryTarget.startRectTop;
      const candW =
        drag.mode === 'se' || drag.mode === 'e' || drag.mode === 'ne'
          ? Math.max(80, primaryTarget.startWidth + dx)
          : primaryTarget.startWidth;
      const candH =
        drag.mode === 'se' || drag.mode === 's' || drag.mode === 'sw'
          ? Math.max(32, primaryTarget.startHeight + dy)
          : primaryTarget.startHeight;

      const candRight = candLeft + candW;
      const candBottom = candTop + candH;
      const candCenterX = candLeft + candW / 2;
      const candCenterY = candTop + candH / 2;

      let snappedX = false;
      let snappedY = false;

      for (const r of drag.otherRects) {
        const rCenterX = r.left + r.width / 2;
        const rCenterY = r.top + r.height / 2;

        if (!snappedX) {
          if (Math.abs(candLeft - r.left) <= SNAP_THRESHOLD && drag.mode === 'move') {
            dx += r.left - candLeft;
            snappedX = true;
            activeGuides.push({
              type: 'vertical',
              pos: r.left,
              start: Math.min(candTop, r.top) - 16,
              end: Math.max(candBottom, r.bottom) + 16,
              label: 'Left Align',
            });
          } else if (
            Math.abs(candRight - r.right) <= SNAP_THRESHOLD &&
            (drag.mode === 'move' || drag.mode === 'se' || drag.mode === 'e')
          ) {
            dx += r.right - candRight;
            snappedX = true;
            activeGuides.push({
              type: 'vertical',
              pos: r.right,
              start: Math.min(candTop, r.top) - 16,
              end: Math.max(candBottom, r.bottom) + 16,
              label: 'Right Align',
            });
          } else if (
            Math.abs(candCenterX - rCenterX) <= SNAP_THRESHOLD &&
            drag.mode === 'move'
          ) {
            dx += rCenterX - candCenterX;
            snappedX = true;
            activeGuides.push({
              type: 'vertical',
              pos: rCenterX,
              start: Math.min(candTop, r.top) - 16,
              end: Math.max(candBottom, r.bottom) + 16,
              label: 'Center X',
            });
          }
        }

        if (!snappedY) {
          if (Math.abs(candTop - r.top) <= SNAP_THRESHOLD && drag.mode === 'move') {
            dy += r.top - candTop;
            snappedY = true;
            activeGuides.push({
              type: 'horizontal',
              pos: r.top,
              start: Math.min(candLeft, r.left) - 16,
              end: Math.max(candRight, r.right) + 16,
              label: 'Top Align',
            });
          } else if (
            Math.abs(candBottom - r.bottom) <= SNAP_THRESHOLD &&
            (drag.mode === 'move' || drag.mode === 'se' || drag.mode === 's')
          ) {
            dy += r.bottom - candBottom;
            snappedY = true;
            activeGuides.push({
              type: 'horizontal',
              pos: r.bottom,
              start: Math.min(candLeft, r.left) - 16,
              end: Math.max(candRight, r.right) + 16,
              label: 'Bottom Align',
            });
          } else if (
            Math.abs(candCenterY - rCenterY) <= SNAP_THRESHOLD &&
            drag.mode === 'move'
          ) {
            dy += rCenterY - candCenterY;
            snappedY = true;
            activeGuides.push({
              type: 'horizontal',
              pos: rCenterY,
              start: Math.min(candLeft, r.left) - 16,
              end: Math.max(candRight, r.right) + 16,
              label: 'Center Y',
            });
          }
        }

        if (snappedX && snappedY) break;
      }
    }

    const MIN_W = 80;
    const MIN_H = 32;

    for (const t of drag.targets) {
      if (drag.mode === 'move') {
        t.curX = Math.round(t.startX + dx);
        t.curY = Math.round(t.startY + dy);
      } else if (drag.mode === 'se') {
        t.curWidth = Math.max(MIN_W, Math.round(t.startWidth + dx));
        t.curHeight = Math.max(MIN_H, Math.round(t.startHeight + dy));
      } else if (drag.mode === 'e') {
        t.curWidth = Math.max(MIN_W, Math.round(t.startWidth + dx));
      } else if (drag.mode === 's') {
        t.curHeight = Math.max(MIN_H, Math.round(t.startHeight + dy));
      } else if (drag.mode === 'sw') {
        const nextW = Math.max(MIN_W, Math.round(t.startWidth - dx));
        t.curX = Math.round(t.startX + (t.startWidth - nextW));
        t.curWidth = nextW;
        t.curHeight = Math.max(MIN_H, Math.round(t.startHeight + dy));
      } else if (drag.mode === 'ne') {
        const nextH = Math.max(MIN_H, Math.round(t.startHeight - dy));
        t.curY = Math.round(t.startY + (t.startHeight - nextH));
        t.curWidth = Math.max(MIN_W, Math.round(t.startWidth + dx));
        t.curHeight = nextH;
      } else if (drag.mode === 'nw') {
        const nextW = Math.max(MIN_W, Math.round(t.startWidth - dx));
        const nextH = Math.max(MIN_H, Math.round(t.startHeight - dy));
        t.curX = Math.round(t.startX + (t.startWidth - nextW));
        t.curY = Math.round(t.startY + (t.startHeight - nextH));
        t.curWidth = nextW;
        t.curHeight = nextH;
      }
    }

    if (drag.rafId === null) {
      drag.rafId = window.requestAnimationFrame(() => {
        const currentDrag = dragRef.current;
        if (!currentDrag) return;
        currentDrag.rafId = null;

        setSmartGuides(activeGuides);

        for (const t of currentDrag.targets) {
          // Ensure element is positioned so CSS transform and stacking works without layout clipping
          const cs = window.getComputedStyle(t.el);
          if (cs.position === 'static') {
            t.el.style.position = 'relative';
          }
          if (t.el.parentElement && window.getComputedStyle(t.el.parentElement).overflow === 'hidden') {
            t.el.parentElement.style.overflow = 'visible';
          }

          if (currentDrag.hasResized) {
            t.el.style.width = `${t.curWidth}px`;
            t.el.style.maxWidth = 'none';
            t.el.style.height = `${t.curHeight}px`;
            t.el.style.minHeight = `${t.curHeight}px`;
          }
          if (t.curX !== 0 || t.curY !== 0) {
            t.el.style.transform = `translate3d(${t.curX}px, ${t.curY}px, 0)`;
          } else {
            t.el.style.transform = '';
          }
        }

        for (const t of currentDrag.targets) {
          const rect = t.el.getBoundingClientRect();
          const overlayEl = boxOverlayRefs.current[t.id];
          if (overlayEl) {
            overlayEl.style.top = `${rect.top}px`;
            overlayEl.style.left = `${rect.left}px`;
            overlayEl.style.width = `${rect.width}px`;
            overlayEl.style.height = `${rect.height}px`;
          }
          const dimsBadge = badgeDimsRefs.current[t.id];
          if (dimsBadge) {
            dimsBadge.textContent = `${t.curWidth} × ${t.curHeight}px`;
          }
          const coordsBadge = badgeCoordsRefs.current[t.id];
          if (coordsBadge) {
            coordsBadge.textContent = `XY(${t.curX}, ${t.curY})`;
          }
        }
      });
    }
  };

  const handlePointerUpOverlay = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    e.preventDefault();
    e.stopPropagation();

    if (drag.rafId !== null) {
      window.cancelAnimationFrame(drag.rafId);
      drag.rafId = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const patches: Record<string, Partial<ContainerLayoutConfig>> = {};
    for (const t of drag.targets) {
      const existing = layouts[t.id];
      const patch: Partial<ContainerLayoutConfig> = {
        label: t.label,
        selector: t.selector,
        relativeSelector: t.relativeSelector,
        pageScope: t.pageScope,
        x: t.curX,
        y: t.curY,
        computedPadding: t.padding,
        computedMargin: t.margin,
      };
      if (
        drag.hasResized ||
        typeof existing?.width === 'number' ||
        typeof existing?.height === 'number'
      ) {
        patch.width = t.curWidth;
        patch.height = t.curHeight;
      }
      patches[t.id] = patch;
    }

    dragRef.current = null;
    setIsDragging(false);
    setSmartGuides([]);
    updateMultipleContainerLayouts(patches);
    requestAnimationFrame(refreshSelectedBoxes);
  };

  // Drag handlers for moving the Hovering MS Office Arrange Menu itself
  const handleMenuDragDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const currentPos = computedMenuPos;
    menuDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: currentPos.x,
      origY: currentPos.y,
    };
  };

  const handleMenuDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const md = menuDragRef.current;
    if (!md || md.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    const nx = Math.max(
      12,
      Math.min(window.innerWidth - 460, md.origX + (e.clientX - md.startX))
    );
    const ny = Math.max(
      12,
      Math.min(window.innerHeight - 160, md.origY + (e.clientY - md.startY))
    );
    setMenuPinnedPos({ x: nx, y: ny });
  };

  const handleMenuDragUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const md = menuDragRef.current;
    if (!md || md.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    menuDragRef.current = null;
  };

  const computedMenuPos = useMemo(() => {
    if (menuPinnedPos) return menuPinnedPos;
    if (!unionBounds || typeof window === 'undefined') {
      return { x: 24, y: 24 };
    }
    const menuWidth = 580;
    const menuHeight = 118;
    const idealX = Math.max(
      16,
      Math.min(
        window.innerWidth - menuWidth - 16,
        unionBounds.centerX - menuWidth / 2
      )
    );
    const aboveY = unionBounds.top - menuHeight - 36;
    const belowY = unionBounds.top + unionBounds.height + 36;
    const idealY =
      aboveY >= 12
        ? aboveY
        : belowY + menuHeight < window.innerHeight - 80
          ? belowY
          : 16;

    return { x: Math.round(idealX), y: Math.round(idealY) };
  }, [menuPinnedPos, unionBounds]);

  if (!isDevMode) {
    return null;
  }

  const primaryBox = selectedBoxes[0];
  const primarySaved = primaryBox ? layouts[primaryBox.id] : undefined;
  const activeScopeInfo = getActivePageScopeInfo(primaryBox?.el);
  const isPresentationRoute = activeScopeInfo.scope.startsWith('presentation-');

  return (
    <div
      data-dev-overlay="true"
      className="fixed inset-0 pointer-events-none z-[9980] overflow-hidden select-none"
    >
      {/* 0. VISUAL SNAP GRID OVERLAY */}
      {snapSettings.showGridOverlay && (
        <div
          className="fixed inset-0 pointer-events-none opacity-35"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(34, 211, 238, 0.28) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 211, 238, 0.28) 1px, transparent 1px),
              linear-gradient(to right, rgba(255, 215, 0, 0.22) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 215, 0, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: `
              ${snapSettings.gridSize}px ${snapSettings.gridSize}px,
              ${snapSettings.gridSize}px ${snapSettings.gridSize}px,
              ${snapSettings.gridSize * 4}px ${snapSettings.gridSize * 4}px,
              ${snapSettings.gridSize * 4}px ${snapSettings.gridSize * 4}px
            `,
          }}
        />
      )}

      {/* 0.5 SMART OBJECT ALIGNMENT GUIDES */}
      {smartGuides.map((g, idx) =>
        g.type === 'vertical' ? (
          <div
            key={`v-${idx}`}
            style={{
              left: `${g.pos}px`,
              top: `${g.start}px`,
              height: `${Math.max(24, g.end - g.start)}px`,
            }}
            className="fixed w-[1.5px] bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.95)] pointer-events-none z-[9995]"
          >
            {g.label && (
              <span className="absolute -top-5 -left-6 px-1.5 py-0.5 rounded bg-fuchsia-950/95 border border-fuchsia-400 text-[9px] font-mono text-fuchsia-200 whitespace-nowrap">
                {g.label}
              </span>
            )}
          </div>
        ) : (
          <div
            key={`h-${idx}`}
            style={{
              top: `${g.pos}px`,
              left: `${g.start}px`,
              width: `${Math.max(24, g.end - g.start)}px`,
            }}
            className="fixed h-[1.5px] bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.95)] pointer-events-none z-[9995]"
          >
            {g.label && (
              <span className="absolute -top-5 left-2 px-1.5 py-0.5 rounded bg-fuchsia-950/95 border border-fuchsia-400 text-[9px] font-mono text-fuchsia-200 whitespace-nowrap">
                {g.label}
              </span>
            )}
          </div>
        )
      )}

      {/* 1. HOVER PREVIEW BOUNDING BOX */}
      {hoveredBox && !isDragging && (
        <div
          style={{
            top: `${hoveredBox.top}px`,
            left: `${hoveredBox.left}px`,
            width: `${hoveredBox.width}px`,
            height: `${hoveredBox.height}px`,
          }}
          className="fixed pointer-events-none border-2 border-dashed border-cyan-400/80 bg-cyan-400/5 rounded-xl transition-all duration-75"
        >
          <div className="absolute -top-6 left-0 px-2 py-0.5 rounded-md bg-zinc-950/95 border border-cyan-400 text-[10px] font-mono text-cyan-300 whitespace-nowrap shadow-lg flex items-center gap-1.5">
            {hoveredBox.groupId && (
              <span className="px-1 rounded bg-purple-500/30 border border-purple-400 text-purple-200 text-[9px] font-black">
                GROUP
              </span>
            )}
            <span className="font-black text-[#ffd700]">{hoveredBox.label}</span>
            <span className="text-zinc-400">
              {hoveredBox.width} × {hoveredBox.height}px
            </span>
            <span className="text-[9px] text-emerald-300">
              {selectedIds.length > 0
                ? '• Shift+Click to Multi-Select'
                : '• Click to Select (Right-Click for Menu)'}
            </span>
          </div>
        </div>
      )}

      {/* 2. UNIFIED GROUP / MULTI-SELECTION OUTER FRAME */}
      {unionBounds && selectedBoxes.length > 1 && !isDragging && (
        <div
          style={{
            top: `${unionBounds.top - 6}px`,
            left: `${unionBounds.left - 6}px`,
            width: `${unionBounds.width + 12}px`,
            height: `${unionBounds.height + 12}px`,
          }}
          className={`fixed pointer-events-none rounded-2xl border-2 ${
            unionBounds.groupId
              ? 'border-purple-400 ring-2 ring-purple-500/40 bg-purple-500/[0.02]'
              : 'border-dashed border-cyan-300/70 bg-cyan-400/[0.01]'
          }`}
        >
          <div
            data-dev-overlay="true"
            onPointerDown={(e) =>
              primaryBox && handlePointerDownOverlay(e, primaryBox, 'move')
            }
            onPointerMove={handlePointerMoveOverlay}
            onPointerUp={handlePointerUpOverlay}
            onPointerCancel={handlePointerUpOverlay}
            className="pointer-events-auto absolute -top-6 right-0 px-2 py-0.5 rounded-t-md bg-purple-950/95 border border-purple-400 text-[10px] font-mono text-purple-200 shadow-lg flex items-center gap-1.5 cursor-grab active:cursor-grabbing"
          >
            <Group size={11} className="text-[#ffd700]" />
            <span className="font-black text-[#ffd700]">
              {unionBounds.groupId
                ? `GROUP (${selectedBoxes.length} items)`
                : `MULTI-SELECT (${selectedBoxes.length} items)`}
            </span>
            <span className="text-purple-300">
              {Math.round(unionBounds.width)} × {Math.round(unionBounds.height)}px
            </span>
          </div>
        </div>
      )}

      {/* 3. ACTIVE SELECTION BOUNDING BOXES */}
      {selectedBoxes.map((box, index) => {
        const saved = layouts[box.id];
        const hasMods = Boolean(
          saved &&
            (typeof saved.width === 'number' ||
              typeof saved.height === 'number' ||
              (typeof saved.x === 'number' && saved.x !== 0) ||
              (typeof saved.y === 'number' && saved.y !== 0) ||
              (typeof saved.order === 'number' && saved.order !== 0) ||
              (typeof saved.zIndex === 'number' && saved.zIndex !== 0))
        );

        return (
          <div
            key={box.id}
            ref={(node) => {
              boxOverlayRefs.current[box.id] = node;
            }}
            style={{
              top: `${box.top}px`,
              left: `${box.left}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
            }}
            className={`fixed pointer-events-none border-2 border-dashed ${
              box.groupId
                ? 'border-purple-400 ring-2 ring-[#ffd700]/70'
                : 'border-[#ffd700] ring-2 ring-cyan-400/70'
            } bg-[#ffd700]/[0.03] shadow-[0_0_25px_rgba(34,211,238,0.28)] rounded-xl`}
          >
            {/* DRAGGABLE HEADER BAR */}
            <div
              data-dev-overlay="true"
              onPointerDown={(e) => handlePointerDownOverlay(e, box, 'move')}
              onPointerMove={handlePointerMoveOverlay}
              onPointerUp={handlePointerUpOverlay}
              onPointerCancel={handlePointerUpOverlay}
              className="pointer-events-auto absolute -top-7 left-0 right-0 min-w-[220px] flex items-center justify-between gap-1.5 px-2 py-1 rounded-t-lg bg-zinc-950/95 hover:bg-zinc-900 border border-[#ffd700] text-[10px] font-mono text-white shadow-xl cursor-grab active:cursor-grabbing touch-none"
            >
              <div className="flex items-center gap-1 min-w-0">
                <GripHorizontal size={12} className="text-[#ffd700] shrink-0" />
                {selectedBoxes.length > 1 && (
                  <span className="px-1 rounded bg-cyan-500 text-black font-black text-[9px] shrink-0">
                    #{index + 1}/{selectedBoxes.length}
                  </span>
                )}
                {box.groupId && (
                  <span className="px-1 rounded bg-purple-500/30 border border-purple-400 text-purple-200 text-[8px] font-black shrink-0">
                    GRP
                  </span>
                )}
                <span className="font-black text-[#ffd700] truncate max-w-[120px]">
                  {box.label}
                </span>
                {typeof saved?.zIndex === 'number' && saved.zIndex !== 0 && (
                  <span className="px-1 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[8px] font-bold shrink-0">
                    Z:{saved.zIndex}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectSiblings(box.el)}
                  className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Select all sibling cards in the same Grid or Flex container"
                >
                  <Layers size={9} />
                  <span>Siblings</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectChildren(box.el)}
                  className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-200 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Drill In: Select child elements inside this container"
                >
                  <CornerRightDown size={9} />
                  <span>Inside</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectParent(box.el)}
                  className="px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 text-[9px] font-bold flex items-center cursor-pointer"
                  title="Drill Out: Select parent container"
                >
                  <CornerLeftUp size={9} />
                </button>

                {hasMods && (
                  <button
                    type="button"
                    onClick={() => handleResetSingle(box)}
                    className="px-1 py-0.5 rounded bg-red-950/90 hover:bg-red-800 border border-red-400/50 text-red-200 text-[9px] font-bold cursor-pointer"
                    title="Reset this element"
                  >
                    <RotateCcw size={9} />
                  </button>
                )}
              </div>
            </div>

            {/* FLOATING REAL-TIME DIMENSIONS BADGE */}
            <div className="pointer-events-none absolute -bottom-6 right-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950/95 border border-cyan-400 shadow-lg text-[10px] font-mono whitespace-nowrap">
              <span className="flex items-center gap-1 text-[#ffd700] font-black">
                <Maximize2 size={9} className="text-cyan-400" />
                <span
                  ref={(node) => {
                    badgeDimsRefs.current[box.id] = node;
                  }}
                >
                  {saved?.width ?? box.width} × {saved?.height ?? box.height}px
                </span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-cyan-300">
                Pad: <strong className="text-white">{box.padding}</strong>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-amber-300">
                Mgn: <strong className="text-white">{box.margin}</strong>
              </span>
              <span
                ref={(node) => {
                  badgeCoordsRefs.current[box.id] = node;
                }}
                className="text-emerald-300 font-bold"
              >
                {saved?.x || saved?.y
                  ? `XY(${saved?.x ?? 0}, ${saved?.y ?? 0})`
                  : ''}
              </span>
            </div>

            {/* 4 CORNER RESIZE HANDLES + 2 EDGE HANDLES */}
            <div
              data-dev-overlay="true"
              onPointerDown={(e) => handlePointerDownOverlay(e, box, 'nw')}
              onPointerMove={handlePointerMoveOverlay}
              onPointerUp={handlePointerUpOverlay}
              onPointerCancel={handlePointerUpOverlay}
              title="Drag to resize width & height"
              className="pointer-events-auto absolute -top-2 -left-2 w-4 h-4 rounded-sm bg-[#ffd700] hover:bg-cyan-300 border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.95)] cursor-nwse-resize touch-none hover:scale-125 transition-transform z-10"
            />
            <div
              data-dev-overlay="true"
              onPointerDown={(e) => handlePointerDownOverlay(e, box, 'ne')}
              onPointerMove={handlePointerMoveOverlay}
              onPointerUp={handlePointerUpOverlay}
              onPointerCancel={handlePointerUpOverlay}
              title="Drag to resize width & height"
              className="pointer-events-auto absolute -top-2 -right-2 w-4 h-4 rounded-sm bg-[#ffd700] hover:bg-cyan-300 border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.95)] cursor-nesw-resize touch-none hover:scale-125 transition-transform z-10"
            />
            <div
              data-dev-overlay="true"
              onPointerDown={(e) => handlePointerDownOverlay(e, box, 'sw')}
              onPointerMove={handlePointerMoveOverlay}
              onPointerUp={handlePointerUpOverlay}
              onPointerCancel={handlePointerUpOverlay}
              title="Drag to resize width & height"
              className="pointer-events-auto absolute -bottom-2 -left-2 w-4 h-4 rounded-sm bg-[#ffd700] hover:bg-cyan-300 border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.95)] cursor-nesw-resize touch-none hover:scale-125 transition-transform z-10"
            />
            <div
              data-dev-overlay="true"
              onPointerDown={(e) => handlePointerDownOverlay(e, box, 'se')}
              onPointerMove={handlePointerMoveOverlay}
              onPointerUp={handlePointerUpOverlay}
              onPointerCancel={handlePointerUpOverlay}
              title="Drag to resize width & height"
              className="pointer-events-auto absolute -bottom-2 -right-2 w-4 h-4 rounded-sm bg-[#ffd700] hover:bg-cyan-300 border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)] cursor-nwse-resize touch-none hover:scale-125 transition-transform z-10"
            />
            <div
              data-dev-overlay="true"
              onPointerDown={(e) => handlePointerDownOverlay(e, box, 'e')}
              onPointerMove={handlePointerMoveOverlay}
              onPointerUp={handlePointerUpOverlay}
              onPointerCancel={handlePointerUpOverlay}
              title="Drag to resize width"
              className="pointer-events-auto absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-6 rounded-full bg-cyan-400 hover:bg-[#ffd700] border border-black shadow cursor-ew-resize touch-none z-10"
            />
            <div
              data-dev-overlay="true"
              onPointerDown={(e) => handlePointerDownOverlay(e, box, 's')}
              onPointerMove={handlePointerMoveOverlay}
              onPointerUp={handlePointerUpOverlay}
              onPointerCancel={handlePointerUpOverlay}
              title="Drag to resize height"
              className="pointer-events-auto absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-6 h-2.5 rounded-full bg-cyan-400 hover:bg-[#ffd700] border border-black shadow cursor-ns-resize touch-none z-10"
            />

            {/* DIRECT DRAG-TO-MOVE BODY CANVAS (Click and drag anywhere inside the box to move it) */}
            <div
              data-dev-overlay="true"
              onPointerDown={(e) => handlePointerDownOverlay(e, box, 'move')}
              onPointerMove={handlePointerMoveOverlay}
              onPointerUp={handlePointerUpOverlay}
              onPointerCancel={handlePointerUpOverlay}
              title="Click and drag anywhere to move this element"
              className="pointer-events-auto absolute inset-0 cursor-move touch-none bg-cyan-400/[0.04] hover:bg-cyan-400/[0.09] active:cursor-grabbing transition-colors"
            />
          </div>
        );
      })}

      {/* 4. MICROSOFT OFFICE-STYLE HOVERING ARRANGE, GROUP & PAGE COPY MINI-TOOLBAR */}
      {selectedBoxes.length > 0 && !isDragging && (
        <div
          data-dev-overlay="true"
          style={{
            left: `${computedMenuPos.x}px`,
            top: `${computedMenuPos.y}px`,
          }}
          className="fixed pointer-events-auto z-[9992] w-[585px] max-w-[96vw] rounded-2xl bg-zinc-950/95 backdrop-blur-xl border-2 border-[#ffd700]/90 ring-1 ring-cyan-400/50 shadow-[0_16px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(255,215,0,0.22)] text-white font-mono overflow-hidden"
        >
          {/* TOP RIBBON HEADER BAR */}
          <div
            onPointerDown={handleMenuDragDown}
            onPointerMove={handleMenuDragMove}
            onPointerUp={handleMenuDragUp}
            onPointerCancel={handleMenuDragUp}
            className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-b border-white/10 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <GripVertical size={13} className="text-[#ffd700] shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ffd700] shrink-0">
                Arrange
              </span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-bold truncate max-w-[110px]">
                {selectedBoxes.length === 1
                  ? primaryBox?.label.slice(0, 16)
                  : `${selectedBoxes.length} Selected`}
              </span>
              {copyFeedback && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400 text-emerald-200 text-[9px] font-bold flex items-center gap-1 animate-pulse">
                  <Check size={10} />
                  {copyFeedback}
                </span>
              )}
            </div>

            {/* Ribbon Sub-Tabs */}
            <div
              className="flex items-center gap-1 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveMenuTab('arrange')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  activeMenuTab === 'arrange'
                    ? 'bg-[#ffd700] text-black font-black'
                    : 'bg-white/5 hover:bg-white/15 text-zinc-300'
                }`}
              >
                Group &amp; Order
              </button>
              <button
                type="button"
                onClick={() => setActiveMenuTab('align')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  activeMenuTab === 'align'
                    ? 'bg-[#ffd700] text-black font-black'
                    : 'bg-white/5 hover:bg-white/15 text-zinc-300'
                }`}
              >
                Align &amp; Size
              </button>
              <button
                type="button"
                onClick={() => setActiveMenuTab('pagecopy')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  activeMenuTab === 'pagecopy'
                    ? 'bg-[#ffd700] text-black font-black'
                    : 'bg-white/5 hover:bg-white/15 text-zinc-300'
                }`}
              >
                Page Copy
              </button>
              <button
                type="button"
                onClick={() => setActiveMenuTab('snap')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  activeMenuTab === 'snap'
                    ? 'bg-[#ffd700] text-black font-black'
                    : 'bg-white/5 hover:bg-white/15 text-zinc-300'
                }`}
              >
                Grid &amp; Snap
              </button>

              <div className="flex items-center gap-0.5 border-l border-white/15 pl-1.5 ml-1">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={() => undo()}
                  className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-amber-300 hover:text-amber-200 cursor-pointer"
                  title={`Undo (Ctrl+Z)${undoCount > 0 ? ` • ${undoCount} step(s)` : ''}`}
                >
                  <Undo2 size={11} />
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={() => redo()}
                  className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-cyan-300 hover:text-cyan-200 cursor-pointer"
                  title={`Redo (Ctrl+Y or Ctrl+Shift+Z)${redoCount > 0 ? ` • ${redoCount} step(s)` : ''}`}
                >
                  <Redo2 size={11} />
                </button>
              </div>

              {menuPinnedPos ? (
                <button
                  type="button"
                  onClick={() => setMenuPinnedPos(null)}
                  className="ml-0.5 p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 cursor-pointer"
                  title="Unpin menu (follow selection automatically)"
                >
                  <PinOff size={11} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMenuPinnedPos(computedMenuPos)}
                  className="ml-0.5 p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-400 cursor-pointer"
                  title="Pin menu to current screen position"
                >
                  <Pin size={11} />
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: GROUP, ORDER (BRING TO FRONT / SEND TO BACK), OVERLAP & NUDGE */}
          {activeMenuTab === 'arrange' && (
            <div className="p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-xl px-2 py-1">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={() => undo()}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-amber-200 font-bold cursor-pointer"
                  title={`Undo last action (Ctrl+Z)${undoCount > 0 ? ` • ${undoCount} available` : ''}`}
                >
                  <Undo2 size={11} className="text-[#ffd700]" />
                  <span>Undo{undoCount > 0 ? ` (${undoCount})` : ''}</span>
                </button>

                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={() => redo()}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-cyan-200 font-bold cursor-pointer"
                  title={`Redo next action (Ctrl+Y or Ctrl+Shift+Z)${redoCount > 0 ? ` • ${redoCount} available` : ''}`}
                >
                  <Redo2 size={11} className="text-cyan-400" />
                  <span>Redo{redoCount > 0 ? ` (${redoCount})` : ''}</span>
                </button>

                <button
                  type="button"
                  disabled={selectedBoxes.length < 2}
                  onClick={groupSelectedContainers}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all ${
                    selectedBoxes.length >= 2
                      ? 'bg-purple-500/25 hover:bg-purple-500/40 border border-purple-400/60 text-purple-200 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed text-zinc-500'
                  }`}
                  title="Group selected items into a single unit (Ctrl+G)"
                >
                  <Group size={12} className="text-[#ffd700]" />
                  <span>Group</span>
                </button>

                <button
                  type="button"
                  disabled={!unionBounds?.hasAnyGrouped}
                  onClick={ungroupSelectedContainers}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all ${
                    unionBounds?.hasAnyGrouped
                      ? 'bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/60 text-amber-200 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed text-zinc-500'
                  }`}
                  title="Ungroup items (Ctrl+Shift+G)"
                >
                  <Ungroup size={12} />
                  <span>Ungroup</span>
                </button>

                {lastUngroupedIds.length >= 2 && (
                  <button
                    type="button"
                    onClick={regroupContainers}
                    className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 font-bold cursor-pointer"
                    title="Regroup previously ungrouped items"
                  >
                    <span>Regroup</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSelectAllOnPage}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-200 font-bold cursor-pointer"
                  title="Select All Elements on this page/slide (Ctrl + A)"
                >
                  <CheckSquare size={11} className="text-emerald-300" />
                  <span>Select All</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectChildren()}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold cursor-pointer"
                  title="Drill In: Select child cards inside current container"
                >
                  <CornerRightDown size={11} />
                  <span>Drill In</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSiblings()}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 font-bold cursor-pointer"
                  title="Select all sibling cards in this Grid/Flex container"
                >
                  <Layers size={11} />
                  <span>Siblings</span>
                </button>
              </div>

              <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={() => handleLayerCommand('front')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-[#ffd700] font-bold cursor-pointer"
                  title="Bring to Front (Shift + ])"
                >
                  <BringToFront size={12} />
                  <span>Front</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLayerCommand('forward')}
                  className="px-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 font-bold cursor-pointer"
                  title="Bring Forward (])"
                >
                  +Z
                </button>

                <button
                  type="button"
                  onClick={() => handleLayerCommand('backward')}
                  className="px-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 font-bold cursor-pointer"
                  title="Send Backward ([)"
                >
                  -Z
                </button>

                <button
                  type="button"
                  onClick={() => handleLayerCommand('back')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/20 text-zinc-200 font-bold cursor-pointer"
                  title="Send to Back (Shift + [)"
                >
                  <SendToBack size={12} />
                  <span>Back</span>
                </button>
              </div>

              <div className="flex items-center justify-between w-full pt-1 border-t border-white/10 gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleOverlapFree}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                      primarySaved?.overlapFree
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                        : 'bg-white/5 border-white/15 text-zinc-300 hover:bg-white/10'
                    }`}
                    title="Allow overlapping neighboring items without clipping"
                  >
                    <Move size={11} />
                    <span>
                      Overlap: {primarySaved?.overlapFree ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 bg-black/60 border border-white/15 rounded-lg px-2 py-0.5">
                    <ArrowUpDown size={10} className="text-cyan-400" />
                    <span className="text-zinc-400 text-[9px]">Grid Order:</span>
                    <button
                      type="button"
                      onClick={() => handleAdjustOrderMulti(-1)}
                      className="px-1 rounded bg-white/10 hover:bg-white/20 text-cyan-300 font-black cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-[#ffd700] font-black">
                      {primarySaved?.order ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustOrderMulti(1)}
                      className="px-1 rounded bg-white/10 hover:bg-white/20 text-cyan-300 font-black cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-black/60 border border-white/15 rounded-lg px-2 py-0.5">
                  <span className="text-[9px] text-zinc-400 mr-1">
                    Nudge ({snapSettings.snapToGrid ? `${snapSettings.gridSize}px` : '4px'}):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleNudgeSelected(
                        -(snapSettings.snapToGrid ? snapSettings.gridSize : 4),
                        0
                      )
                    }
                    className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 cursor-pointer"
                    title="Nudge Left (ArrowLeft)"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleNudgeSelected(
                        0,
                        -(snapSettings.snapToGrid ? snapSettings.gridSize : 4)
                      )
                    }
                    className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 cursor-pointer"
                    title="Nudge Up (ArrowUp)"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleNudgeSelected(
                        0,
                        snapSettings.snapToGrid ? snapSettings.gridSize : 4
                      )
                    }
                    className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 cursor-pointer"
                    title="Nudge Down (ArrowDown)"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleNudgeSelected(
                        snapSettings.snapToGrid ? snapSettings.gridSize : 4,
                        0
                      )
                    }
                    className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 cursor-pointer"
                    title="Nudge Right (ArrowRight)"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALIGNMENT, DISTRIBUTION & SIZE MATCHING */}
          {activeMenuTab === 'align' && (
            <div className="p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-xl px-2 py-1">
                <span className="text-[9px] text-zinc-400 mr-1">Align:</span>
                <button
                  type="button"
                  disabled={selectedBoxes.length < 2}
                  onClick={() => handleAlignSelected('left')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-cyan-300 cursor-pointer"
                  title="Align Left Edges"
                >
                  <AlignLeft size={13} />
                </button>
                <button
                  type="button"
                  disabled={selectedBoxes.length < 2}
                  onClick={() => handleAlignSelected('center')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-cyan-300 cursor-pointer"
                  title="Align Horizontal Centers"
                >
                  <AlignCenterHorizontal size={13} />
                </button>
                <button
                  type="button"
                  disabled={selectedBoxes.length < 2}
                  onClick={() => handleAlignSelected('right')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-cyan-300 cursor-pointer"
                  title="Align Right Edges"
                >
                  <AlignRight size={13} />
                </button>
                <div className="h-4 w-px bg-white/15 mx-0.5" />
                <button
                  type="button"
                  disabled={selectedBoxes.length < 2}
                  onClick={() => handleAlignSelected('top')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-[#ffd700] cursor-pointer"
                  title="Align Top Edges"
                >
                  <AlignStartVertical size={13} />
                </button>
                <button
                  type="button"
                  disabled={selectedBoxes.length < 2}
                  onClick={() => handleAlignSelected('middle')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-[#ffd700] cursor-pointer"
                  title="Align Vertical Middles"
                >
                  <AlignCenterVertical size={13} />
                </button>
                <button
                  type="button"
                  disabled={selectedBoxes.length < 2}
                  onClick={() => handleAlignSelected('bottom')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-[#ffd700] cursor-pointer"
                  title="Align Bottom Edges"
                >
                  <AlignEndVertical size={13} />
                </button>
              </div>

              <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-xl px-2 py-1">
                <button
                  type="button"
                  disabled={selectedBoxes.length < 3}
                  onClick={() => handleDistributeSelected('horizontal')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-zinc-200 font-bold cursor-pointer"
                  title="Distribute Horizontally (requires 3+ selected items)"
                >
                  <AlignHorizontalSpaceAround size={12} className="text-cyan-400" />
                  <span>Dist H</span>
                </button>
                <button
                  type="button"
                  disabled={selectedBoxes.length < 3}
                  onClick={() => handleDistributeSelected('vertical')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-zinc-200 font-bold cursor-pointer"
                  title="Distribute Vertically (requires 3+ selected items)"
                >
                  <AlignVerticalSpaceAround size={12} className="text-[#ffd700]" />
                  <span>Dist V</span>
                </button>
              </div>

              <div className="flex items-center justify-between w-full pt-1 border-t border-white/10 gap-1.5">
                <span className="text-[9px] text-zinc-400">
                  Match Size (to 1st selected):
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={selectedBoxes.length < 2}
                    onClick={() => handleMatchDimensions('width')}
                    className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 disabled:opacity-35 border border-cyan-400/50 text-cyan-200 font-bold cursor-pointer"
                  >
                    Match Width
                  </button>
                  <button
                    type="button"
                    disabled={selectedBoxes.length < 2}
                    onClick={() => handleMatchDimensions('height')}
                    className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 disabled:opacity-35 border border-cyan-400/50 text-cyan-200 font-bold cursor-pointer"
                  >
                    Match Height
                  </button>
                  <button
                    type="button"
                    disabled={selectedBoxes.length < 2}
                    onClick={() => handleMatchDimensions('both')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ffd700] hover:bg-amber-300 disabled:opacity-35 text-black font-black cursor-pointer"
                  >
                    <CopyCheck size={11} />
                    <span>Match W×H</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CROSS-PAGE / PRESENTATION SLIDE COPY, PASTE & CLONE */}
          {activeMenuTab === 'pagecopy' && (
            <div className="p-2.5 flex flex-col gap-2 text-[10px]">
              {/* Row 1: Copy / Paste Selected Item Style + Copy / Paste Whole Page Layout */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={handleCopySelectedStyle}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 font-bold cursor-pointer"
                    title="Copy Width, Height & Offsets of selected element(s) (Ctrl+Shift+C)"
                  >
                    <ClipboardCopy size={11} />
                    <span>Copy Selected ({selectedBoxes.length})</span>
                  </button>

                  <button
                    type="button"
                    disabled={!copiedSelectionClipboard}
                    onClick={() => handlePasteSelectedStyle(false)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 disabled:opacity-35 border border-emerald-400/50 text-emerald-200 font-bold cursor-pointer"
                    title="Paste copied Width & Height onto currently selected element(s) (Ctrl+Shift+V)"
                  >
                    <ClipboardPaste size={11} />
                    <span>Paste W×H</span>
                  </button>

                  <button
                    type="button"
                    disabled={!copiedSelectionClipboard}
                    onClick={() => handlePasteSelectedStyle(true)}
                    className="px-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-zinc-200 font-bold cursor-pointer"
                    title="Paste Width, Height AND XY Position onto selected element(s)"
                  >
                    +XY
                  </button>
                </div>

                {/* Whole Page Layout Copy & Paste */}
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={handleCopyCurrentPageLayout}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/35 border border-[#ffd700]/60 text-[#ffd700] font-bold cursor-pointer"
                    title="Copy all customized layouts from this page/slide to paste on another page"
                  >
                    <ClipboardCopy size={11} />
                    <span>Copy Page Layout</span>
                  </button>

                  <button
                    type="button"
                    disabled={!copiedPageClipboard}
                    onClick={handlePastePageLayoutHere}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#ffd700] hover:bg-amber-300 disabled:opacity-35 text-black font-black cursor-pointer"
                    title={
                      copiedPageClipboard
                        ? `Paste ${copiedPageClipboard.items.length} layout(s) copied from ${copiedPageClipboard.sourceLabel}`
                        : 'Copy a page layout first'
                    }
                  >
                    <ClipboardPaste size={11} />
                    <span>Paste Page Layout</span>
                  </button>
                </div>
              </div>

              {/* Row 2: 1-Click Broadcast Clone across Presentation Pages */}
              {isPresentationRoute && (
                <div className="flex flex-wrap items-center justify-between pt-1.5 border-t border-white/10 gap-1.5">
                  <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                    <Share2 size={10} className="text-[#ffd700]" />
                    <span>Clone Current Slide Layout To:</span>
                  </span>

                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleCloneToPresentationScopes(
                          [
                            'presentation-page-1',
                            'presentation-page-2',
                            'presentation-page-3',
                          ],
                          'All Player Pages (1–3)'
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-purple-500/25 hover:bg-purple-500/40 border border-purple-400/60 text-purple-200 font-bold cursor-pointer"
                      title="Copy this slide's layout to Player Dossier Pages 1, 2, and 3"
                    >
                      All Player Pages (1–3)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCloneToPresentationScopes(
                          ['presentation-season_awards'],
                          'Season Awards Slide'
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 font-bold cursor-pointer"
                    >
                      Season Awards
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCloneToPresentationScopes(
                          [
                            'presentation-page-1',
                            'presentation-page-2',
                            'presentation-page-3',
                            'presentation-season_awards',
                            'presentation-tale_of_the_tape',
                            'presentation-stacks_and_payouts',
                          ],
                          'All Presentation Slides'
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/60 text-cyan-200 font-bold cursor-pointer"
                      title="Propagate this layout across all Presentation slides"
                    >
                      All Presentation Slides
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SNAP TO GRID, VISUAL GRIDLINES & SMART OBJECT GUIDES */}
          {activeMenuTab === 'snap' && (
            <div className="p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <button
                type="button"
                onClick={() =>
                  updateSnapSettings({ snapToGrid: !snapSettings.snapToGrid })
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                  snapSettings.snapToGrid
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                    : 'bg-white/5 border-white/15 text-zinc-400'
                }`}
                title="Snap movement and resizing to fixed pixel increments (Hold Alt while dragging to bypass)"
              >
                <Magnet size={13} className="text-[#ffd700]" />
                <span>Snap to Grid: {snapSettings.snapToGrid ? 'ON' : 'OFF'}</span>
              </button>

              <div className="flex items-center gap-1 bg-black/60 border border-white/15 rounded-xl px-2 py-1">
                <span className="text-[9px] text-zinc-400 mr-1">Step:</span>
                {[4, 8, 16, 24, 32].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() =>
                      updateSnapSettings({ gridSize: sz, snapToGrid: true })
                    }
                    className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                      snapSettings.gridSize === sz
                        ? 'bg-[#ffd700] text-black font-black'
                        : 'bg-white/5 hover:bg-white/15 text-zinc-300'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between w-full pt-1 border-t border-white/10 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateSnapSettings({
                      showGridOverlay: !snapSettings.showGridOverlay,
                    })
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                    snapSettings.showGridOverlay
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                      : 'bg-white/5 border-white/15 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <Grid size={12} />
                  <span>
                    Gridlines Overlay: {snapSettings.showGridOverlay ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateSnapSettings({
                      snapToObjects: !snapSettings.snapToObjects,
                    })
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                    snapSettings.snapToObjects
                      ? 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-200'
                      : 'bg-white/5 border-white/15 text-zinc-300 hover:bg-white/10'
                  }`}
                  title="Snap to edges and centers of neighboring cards while dragging"
                >
                  <Sparkles size={12} />
                  <span>
                    Smart Guides: {snapSettings.snapToObjects ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

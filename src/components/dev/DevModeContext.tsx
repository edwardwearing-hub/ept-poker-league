'use client';

import { useEffect, useSyncExternalStore } from 'react';

export interface ContainerLayoutConfig {
  id: string;
  label?: string;
  selector?: string;
  relativeSelector?: string;
  pageScope?: string;
  slotRole?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  order?: number;
  zIndex?: number;
  groupId?: string;
  overlapFree?: boolean;
  padding?: string;
  margin?: string;
  computedPadding?: string;
  computedMargin?: string;
}

export interface CopiedItemStyle {
  sourceId: string;
  label?: string;
  relativeSelector?: string;
  idSuffix?: string;
  slotRole?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  order?: number;
  zIndex?: number;
  overlapFree?: boolean;
  groupId?: string;
}

export interface CopiedPageLayoutClipboard {
  sourceScope: string;
  sourceLabel: string;
  copiedAt: string;
  items: CopiedItemStyle[];
}

export interface DevLayoutExportPayload {
  version: number;
  updatedAt: string;
  tailwindClasses: Record<string, string>;
  containers: Record<string, ContainerLayoutConfig>;
}

export interface SnapSettings {
  snapToGrid: boolean;
  gridSize: number;
  showGridOverlay: boolean;
  snapToObjects: boolean;
}

interface DevModeStoreState {
  isDevMode: boolean;
  layouts: Record<string, ContainerLayoutConfig>;
  selectedIds: string[];
  lastUngroupedIds: string[];
  multiSelectMode: boolean;
  interactionMode: 'select' | 'interact';
  snapSettings: SnapSettings;
  copiedPageClipboard: CopiedPageLayoutClipboard | null;
  copiedSelectionClipboard: CopiedItemStyle[] | null;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: string | null;
  past: Record<string, ContainerLayoutConfig>[];
  future: Record<string, ContainerLayoutConfig>[];
}

const STORAGE_KEY = 'ept_academy_dev_layout_v1';
const ACTIVE_SESSION_KEY = 'ept_visual_dev_mode_active';
const PAGE_CLIPBOARD_KEY = 'ept_dev_page_clipboard_v1';
const SELECTION_CLIPBOARD_KEY = 'ept_dev_selection_clipboard_v1';
const MAX_HISTORY_STEPS = 50;

const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  snapToGrid: true,
  gridSize: 8,
  showGridOverlay: false,
  snapToObjects: true,
};

let state: DevModeStoreState = {
  isDevMode: false,
  layouts: {},
  selectedIds: [],
  lastUngroupedIds: [],
  multiSelectMode: false,
  interactionMode: 'select',
  snapSettings: DEFAULT_SNAP_SETTINGS,
  copiedPageClipboard: null,
  copiedSelectionClipboard: null,
  syncStatus: 'idle',
  lastSavedAt: null,
  past: [],
  future: [],
};

const SERVER_SNAPSHOT: DevModeStoreState = {
  isDevMode: false,
  layouts: {},
  selectedIds: [],
  lastUngroupedIds: [],
  multiSelectMode: false,
  interactionMode: 'select',
  snapSettings: DEFAULT_SNAP_SETTINGS,
  copiedPageClipboard: null,
  copiedSelectionClipboard: null,
  syncStatus: 'idle',
  lastSavedAt: null,
  past: [],
  future: [],
};

const listeners = new Set<() => void>();
let isInitialized = false;
let saveDebounceTimer: number | null = null;

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setState(updater: (prev: DevModeStoreState) => DevModeStoreState) {
  state = updater(state);
  emitChange();
}

export function generateTailwindClassForContainer(
  cfg: ContainerLayoutConfig
): string {
  const classes: string[] = [];
  if (typeof cfg.width === 'number' && cfg.width > 0) {
    classes.push(`w-[${Math.round(cfg.width)}px]`, 'max-w-none');
  }
  if (typeof cfg.height === 'number' && cfg.height > 0) {
    classes.push(
      `h-[${Math.round(cfg.height)}px]`,
      `min-h-[${Math.round(cfg.height)}px]`
    );
  }
  if (typeof cfg.x === 'number' && Math.round(cfg.x) !== 0) {
    classes.push(`translate-x-[${Math.round(cfg.x)}px]`);
  }
  if (typeof cfg.y === 'number' && Math.round(cfg.y) !== 0) {
    classes.push(`translate-y-[${Math.round(cfg.y)}px]`);
  }
  if (typeof cfg.order === 'number' && cfg.order !== 0) {
    classes.push(`order-[${cfg.order}]`);
  }
  if (typeof cfg.zIndex === 'number' && cfg.zIndex !== 0) {
    classes.push('relative', `z-[${cfg.zIndex}]`);
  } else if (cfg.overlapFree) {
    classes.push('relative', 'z-[20]');
  }
  if (cfg.padding && cfg.padding.trim()) {
    classes.push(`p-[${cfg.padding.trim().replace(/\s+/g, '_')}]`);
  }
  if (cfg.margin && cfg.margin.trim()) {
    classes.push(`m-[${cfg.margin.trim().replace(/\s+/g, '_')}]`);
  }
  return classes.join(' ');
}

export function buildExportPayload(
  layoutsMap: Record<string, ContainerLayoutConfig> = state.layouts
): DevLayoutExportPayload {
  const tailwindClasses: Record<string, string> = {};
  const cleanedContainers: Record<string, ContainerLayoutConfig> = {};

  for (const [id, cfg] of Object.entries(layoutsMap)) {
    const tw = generateTailwindClassForContainer(cfg);
    if (tw) {
      tailwindClasses[id] = tw;
    }
    cleanedContainers[id] = {
      id: cfg.id,
      ...(cfg.label ? { label: cfg.label } : {}),
      ...(cfg.selector ? { selector: cfg.selector } : {}),
      ...(cfg.relativeSelector ? { relativeSelector: cfg.relativeSelector } : {}),
      ...(cfg.pageScope ? { pageScope: cfg.pageScope } : {}),
      ...(cfg.slotRole ? { slotRole: cfg.slotRole } : {}),
      ...(typeof cfg.width === 'number' ? { width: Math.round(cfg.width) } : {}),
      ...(typeof cfg.height === 'number' ? { height: Math.round(cfg.height) } : {}),
      ...(typeof cfg.x === 'number' && Math.round(cfg.x) !== 0
        ? { x: Math.round(cfg.x) }
        : {}),
      ...(typeof cfg.y === 'number' && Math.round(cfg.y) !== 0
        ? { y: Math.round(cfg.y) }
        : {}),
      ...(typeof cfg.order === 'number' && cfg.order !== 0
        ? { order: cfg.order }
        : {}),
      ...(typeof cfg.zIndex === 'number' && cfg.zIndex !== 0
        ? { zIndex: cfg.zIndex }
        : {}),
      ...(cfg.groupId ? { groupId: cfg.groupId } : {}),
      ...(cfg.overlapFree ? { overlapFree: cfg.overlapFree } : {}),
      ...(cfg.padding ? { padding: cfg.padding } : {}),
      ...(cfg.margin ? { margin: cfg.margin } : {}),
      ...(cfg.computedPadding ? { computedPadding: cfg.computedPadding } : {}),
      ...(cfg.computedMargin ? { computedMargin: cfg.computedMargin } : {}),
    };
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    tailwindClasses,
    containers: cleanedContainers,
  };
}

function persistLayouts(nextLayouts: Record<string, ContainerLayoutConfig>) {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }

  const payload = buildExportPayload(nextLayouts);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }

  if (saveDebounceTimer !== null) {
    window.clearTimeout(saveDebounceTimer);
  }

  setState((prev) => ({ ...prev, syncStatus: 'saving' }));

  saveDebounceTimer = window.setTimeout(() => {
    fetch('/api/dev-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.ok) {
          setState((prev) => ({
            ...prev,
            syncStatus: 'saved',
            lastSavedAt: new Date().toLocaleTimeString(),
          }));
        } else {
          setState((prev) => ({ ...prev, syncStatus: 'error' }));
        }
      })
      .catch(() => {
        setState((prev) => ({ ...prev, syncStatus: 'error' }));
      });
  }, 200);
}

function pushHistorySnapshot(
  prevLayouts: Record<string, ContainerLayoutConfig>,
  pastList: Record<string, ContainerLayoutConfig>[]
): Record<string, ContainerLayoutConfig>[] {
  const clone: Record<string, ContainerLayoutConfig> = JSON.parse(
    JSON.stringify(prevLayouts)
  );
  return [...pastList.slice(-(MAX_HISTORY_STEPS - 1)), clone];
}

function cleanRemovedElementStyles(
  fromLayouts: Record<string, ContainerLayoutConfig>,
  toLayouts: Record<string, ContainerLayoutConfig>
) {
  if (typeof document === 'undefined') return;
  for (const id of Object.keys(fromLayouts)) {
    if (!toLayouts[id]) {
      const el = document.querySelector(
        `[data-dev-container-id="${CSS.escape(id)}"]`
      ) as HTMLElement | null;
      if (el) {
        el.style.width = '';
        el.style.maxWidth = '';
        el.style.height = '';
        el.style.minHeight = '';
        el.style.transform = '';
        el.style.order = '';
        el.style.zIndex = '';
        el.style.position = '';
        el.removeAttribute('data-dev-group-id');
      }
    }
  }
}

export function undo() {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    if (prev.past.length === 0) return prev;
    const targetLayouts = prev.past[prev.past.length - 1];
    const nextPast = prev.past.slice(0, prev.past.length - 1);
    const currentClone: Record<string, ContainerLayoutConfig> = JSON.parse(
      JSON.stringify(prev.layouts)
    );
    const nextFuture = [
      currentClone,
      ...prev.future.slice(0, MAX_HISTORY_STEPS - 1),
    ];

    cleanRemovedElementStyles(prev.layouts, targetLayouts);
    persistLayouts(targetLayouts);

    return {
      ...prev,
      layouts: targetLayouts,
      past: nextPast,
      future: nextFuture,
    };
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ept_dev_refresh_boxes'));
  }
}

export function redo() {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    if (prev.future.length === 0) return prev;
    const targetLayouts = prev.future[0];
    const nextFuture = prev.future.slice(1);
    const currentClone: Record<string, ContainerLayoutConfig> = JSON.parse(
      JSON.stringify(prev.layouts)
    );
    const nextPast = [
      ...prev.past.slice(-(MAX_HISTORY_STEPS - 1)),
      currentClone,
    ];

    cleanRemovedElementStyles(prev.layouts, targetLayouts);
    persistLayouts(targetLayouts);

    return {
      ...prev,
      layouts: targetLayouts,
      past: nextPast,
      future: nextFuture,
    };
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ept_dev_refresh_boxes'));
  }
}

function initStoreOnClient() {
  if (
    isInitialized ||
    typeof window === 'undefined' ||
    process.env.NODE_ENV === 'production'
  ) {
    return;
  }
  isInitialized = true;

  // 1. Check URL flag (?devMode=true) or session state
  try {
    const params = new URLSearchParams(window.location.search);
    const urlFlag = params.get('devMode');
    const sessionFlag = window.sessionStorage.getItem(ACTIVE_SESSION_KEY);

    if (urlFlag === 'true' || urlFlag === '1') {
      state = { ...state, isDevMode: true };
      window.sessionStorage.setItem(ACTIVE_SESSION_KEY, 'true');
    } else if (urlFlag === 'false' || urlFlag === '0') {
      state = { ...state, isDevMode: false };
      window.sessionStorage.setItem(ACTIVE_SESSION_KEY, 'false');
    } else if (sessionFlag === 'true') {
      state = { ...state, isDevMode: true };
    }

    const savedPageClip = window.sessionStorage.getItem(PAGE_CLIPBOARD_KEY);
    if (savedPageClip) {
      state = { ...state, copiedPageClipboard: JSON.parse(savedPageClip) };
    }
    const savedSelClip = window.sessionStorage.getItem(SELECTION_CLIPBOARD_KEY);
    if (savedSelClip) {
      state = { ...state, copiedSelectionClipboard: JSON.parse(savedSelClip) };
    }
  } catch {
    // ignore
  }

  // 2. Hydrate persisted layouts from localStorage or /api/dev-layout
  let hasLocalLayouts = false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const containers = parsed?.containers || parsed;
      if (
        containers &&
        typeof containers === 'object' &&
        Object.keys(containers).length > 0
      ) {
        state = { ...state, layouts: containers };
        hasLocalLayouts = true;
      }
    }
  } catch {
    // ignore
  }

  if (!hasLocalLayouts) {
    fetch('/api/dev-layout')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          data?.containers &&
          typeof data.containers === 'object' &&
          Object.keys(data.containers).length > 0
        ) {
          setState((prev) => ({
            ...prev,
            layouts: data.containers,
            syncStatus: 'saved',
          }));
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch {}
        }
      })
      .catch(() => {});
  }

  // 3. Global keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.altKey && (e.key.toLowerCase() === 'd' || e.code === 'KeyD')) {
      e.preventDefault();
      e.stopPropagation();
      toggleDevMode();
      return;
    }

    if (!state.isDevMode) return;

    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }

    // Ctrl+Z or Cmd+Z -> Undo / Redo
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key.toLowerCase() === 'z' || e.code === 'KeyZ')
    ) {
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    // Ctrl+Y or Cmd+Y -> Redo
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key.toLowerCase() === 'y' || e.code === 'KeyY')
    ) {
      e.preventDefault();
      e.stopPropagation();
      redo();
      return;
    }

    if (e.key === 'Escape' && state.selectedIds.length > 0) {
      setState((prev) => ({ ...prev, selectedIds: [] }));
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) {
        ungroupSelectedContainers();
      } else {
        groupSelectedContainers();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown, { capture: true });
  emitChange();
}

export function toggleDevMode(forceValue?: boolean) {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    const next = typeof forceValue === 'boolean' ? forceValue : !prev.isDevMode;
    try {
      window.sessionStorage.setItem(ACTIVE_SESSION_KEY, String(next));
    } catch {}
    return {
      ...prev,
      isDevMode: next,
      selectedIds: next ? prev.selectedIds : [],
    };
  });
}

export function expandGroupMembers(
  id: string,
  layoutsMap: Record<string, ContainerLayoutConfig>
): string[] {
  const groupId = layoutsMap[id]?.groupId;
  if (!groupId) return [id];

  const members = Object.values(layoutsMap)
    .filter((cfg) => cfg.groupId === groupId)
    .map((cfg) => cfg.id);

  return members.length > 0 ? members : [id];
}

export function setSelectedContainer(id: string | null, additive = false) {
  setState((prev) => {
    if (!id) {
      return { ...prev, selectedIds: [] };
    }
    const targetIds = expandGroupMembers(id, prev.layouts);
    const useMulti = additive || prev.multiSelectMode;

    if (useMulti) {
      const allAlreadySelected = targetIds.every((tid) =>
        prev.selectedIds.includes(tid)
      );
      const nextIds = allAlreadySelected
        ? prev.selectedIds.filter((item) => !targetIds.includes(item))
        : Array.from(new Set([...prev.selectedIds, ...targetIds]));
      return { ...prev, selectedIds: nextIds };
    }
    return { ...prev, selectedIds: targetIds };
  });
}

export function setSelectedContainers(ids: string[]) {
  setState((prev) => {
    const expanded: string[] = [];
    for (const id of ids) {
      expanded.push(...expandGroupMembers(id, prev.layouts));
    }
    return {
      ...prev,
      selectedIds: Array.from(new Set(expanded)),
    };
  });
}

export function groupSelectedContainers() {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    if (prev.selectedIds.length < 2) return prev;
    const newGroupId = `grp-${Date.now().toString(36).slice(-4)}`;
    const nextLayouts = { ...prev.layouts };

    for (const id of prev.selectedIds) {
      const existing = nextLayouts[id] || { id };
      nextLayouts[id] = {
        ...existing,
        id,
        groupId: newGroupId,
      };
    }

    persistLayouts(nextLayouts);
    return {
      ...prev,
      layouts: nextLayouts,
      past: pushHistorySnapshot(prev.layouts, prev.past),
      future: [],
    };
  });
}

export function ungroupSelectedContainers() {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    if (prev.selectedIds.length === 0) return prev;

    const activeGroupIds = new Set<string>();
    for (const id of prev.selectedIds) {
      const gid = prev.layouts[id]?.groupId;
      if (gid) activeGroupIds.add(gid);
    }

    const nextLayouts = { ...prev.layouts };
    const ungroupedIds: string[] = [];

    for (const [id, cfg] of Object.entries(nextLayouts)) {
      if (
        (cfg.groupId && activeGroupIds.has(cfg.groupId)) ||
        prev.selectedIds.includes(id)
      ) {
        if (cfg.groupId) {
          ungroupedIds.push(id);
          const clone = { ...cfg };
          delete clone.groupId;
          nextLayouts[id] = clone;
        }
      }
    }

    persistLayouts(nextLayouts);
    return {
      ...prev,
      layouts: nextLayouts,
      lastUngroupedIds:
        ungroupedIds.length >= 2 ? ungroupedIds : prev.lastUngroupedIds,
      past: pushHistorySnapshot(prev.layouts, prev.past),
      future: [],
    };
  });
}

export function regroupContainers() {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    const idsToGroup =
      prev.lastUngroupedIds.length >= 2
        ? prev.lastUngroupedIds
        : prev.selectedIds;
    if (idsToGroup.length < 2) return prev;

    const newGroupId = `grp-${Date.now().toString(36).slice(-4)}`;
    const nextLayouts = { ...prev.layouts };

    for (const id of idsToGroup) {
      const existing = nextLayouts[id] || { id };
      nextLayouts[id] = {
        ...existing,
        id,
        groupId: newGroupId,
      };
    }

    persistLayouts(nextLayouts);
    return {
      ...prev,
      layouts: nextLayouts,
      selectedIds: idsToGroup,
      lastUngroupedIds: [],
      past: pushHistorySnapshot(prev.layouts, prev.past),
      future: [],
    };
  });
}

export function setCopiedPageClipboard(clip: CopiedPageLayoutClipboard | null) {
  try {
    if (clip) {
      window.sessionStorage.setItem(PAGE_CLIPBOARD_KEY, JSON.stringify(clip));
    } else {
      window.sessionStorage.removeItem(PAGE_CLIPBOARD_KEY);
    }
  } catch {}
  setState((prev) => ({
    ...prev,
    copiedPageClipboard: clip,
  }));
}

export function setCopiedSelectionClipboard(items: CopiedItemStyle[] | null) {
  try {
    if (items) {
      window.sessionStorage.setItem(
        SELECTION_CLIPBOARD_KEY,
        JSON.stringify(items)
      );
    } else {
      window.sessionStorage.removeItem(SELECTION_CLIPBOARD_KEY);
    }
  } catch {}
  setState((prev) => ({
    ...prev,
    copiedSelectionClipboard: items,
  }));
}

/**
 * Clones all container layouts from `sourceScope` (e.g., `presentation-page-1`)
 * into one or more `targetScopes` (e.g., `['presentation-page-2', 'presentation-page-3']`)
 * by remapping their scoped IDs and CSS selectors.
 */
export function cloneScopeLayoutToScopes(
  sourceScope: string,
  targetScopes: string[],
  fallbackItems?: CopiedItemStyle[]
) {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    const nextLayouts = { ...prev.layouts };

    // Gather source items either from saved layouts matching sourceScope or from fallbackItems
    const sourceConfigs = Object.values(prev.layouts).filter(
      (cfg) =>
        cfg.pageScope === sourceScope || cfg.id.startsWith(`${sourceScope}-`)
    );

    const itemsToClone: CopiedItemStyle[] =
      sourceConfigs.length > 0
        ? sourceConfigs.map((cfg) => ({
            sourceId: cfg.id,
            label: cfg.label,
            relativeSelector: cfg.relativeSelector,
            idSuffix: cfg.id.startsWith(`${sourceScope}-`)
              ? cfg.id.slice(sourceScope.length + 1)
              : cfg.id,
            slotRole: cfg.slotRole,
            width: cfg.width,
            height: cfg.height,
            x: cfg.x,
            y: cfg.y,
            order: cfg.order,
            zIndex: cfg.zIndex,
            overlapFree: cfg.overlapFree,
            groupId: cfg.groupId,
          }))
        : fallbackItems || [];

    if (itemsToClone.length === 0) return prev;

    for (const targetScope of targetScopes) {
      if (targetScope === sourceScope) continue;
      for (const item of itemsToClone) {
        const suffix =
          item.idSuffix ||
          (item.sourceId.startsWith(`${sourceScope}-`)
            ? item.sourceId.slice(sourceScope.length + 1)
            : item.sourceId);
        const newId = `${targetScope}-${suffix}`;
        const newSelector = item.relativeSelector
          ? `[data-dev-page-scope="${targetScope}"] > ${item.relativeSelector}`
          : undefined;

        nextLayouts[newId] = {
          ...(nextLayouts[newId] || {}),
          id: newId,
          label: item.label,
          pageScope: targetScope,
          relativeSelector: item.relativeSelector,
          ...(newSelector ? { selector: newSelector } : {}),
          ...(item.slotRole ? { slotRole: item.slotRole } : {}),
          ...(typeof item.width === 'number' ? { width: item.width } : {}),
          ...(typeof item.height === 'number' ? { height: item.height } : {}),
          ...(typeof item.x === 'number' ? { x: item.x } : {}),
          ...(typeof item.y === 'number' ? { y: item.y } : {}),
          ...(typeof item.order === 'number' ? { order: item.order } : {}),
          ...(typeof item.zIndex === 'number' ? { zIndex: item.zIndex } : {}),
          ...(typeof item.overlapFree === 'boolean'
            ? { overlapFree: item.overlapFree }
            : {}),
          ...(item.groupId ? { groupId: `${targetScope}-${item.groupId}` } : {}),
        };
      }
    }

    persistLayouts(nextLayouts);
    return {
      ...prev,
      layouts: nextLayouts,
      past: pushHistorySnapshot(prev.layouts, prev.past),
      future: [],
    };
  });
}

export function updateSnapSettings(patch: Partial<SnapSettings>) {
  setState((prev) => ({
    ...prev,
    snapSettings: {
      ...prev.snapSettings,
      ...patch,
    },
  }));
}

export function toggleMultiSelectMode(forceValue?: boolean) {
  setState((prev) => ({
    ...prev,
    multiSelectMode:
      typeof forceValue === 'boolean' ? forceValue : !prev.multiSelectMode,
  }));
}

export function setInteractionMode(mode: 'select' | 'interact') {
  setState((prev) => ({
    ...prev,
    interactionMode: mode,
  }));
}

export function updateContainerLayout(
  id: string,
  patch: Partial<ContainerLayoutConfig>
) {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    const existing = prev.layouts[id] || { id };
    const updated: ContainerLayoutConfig = {
      ...existing,
      ...patch,
      id,
    };
    const nextLayouts = {
      ...prev.layouts,
      [id]: updated,
    };
    persistLayouts(nextLayouts);
    return {
      ...prev,
      layouts: nextLayouts,
      past: pushHistorySnapshot(prev.layouts, prev.past),
      future: [],
    };
  });
}

export function updateMultipleContainerLayouts(
  patches: Record<string, Partial<ContainerLayoutConfig>>
) {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    const nextLayouts = { ...prev.layouts };
    for (const [id, patch] of Object.entries(patches)) {
      const existing = nextLayouts[id] || { id };
      nextLayouts[id] = {
        ...existing,
        ...patch,
        id,
      };
    }
    persistLayouts(nextLayouts);
    return {
      ...prev,
      layouts: nextLayouts,
      past: pushHistorySnapshot(prev.layouts, prev.past),
      future: [],
    };
  });
}

export function resetContainerLayout(id: string) {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    const nextLayouts = { ...prev.layouts };
    delete nextLayouts[id];
    persistLayouts(nextLayouts);
    return {
      ...prev,
      layouts: nextLayouts,
      past: pushHistorySnapshot(prev.layouts, prev.past),
      future: [],
    };
  });
}

export function resetSelectedLayouts() {
  if (process.env.NODE_ENV === 'production') return;
  setState((prev) => {
    const nextLayouts = { ...prev.layouts };
    for (const id of prev.selectedIds) {
      delete nextLayouts[id];
    }
    persistLayouts(nextLayouts);
    return {
      ...prev,
      layouts: nextLayouts,
      past: pushHistorySnapshot(prev.layouts, prev.past),
      future: [],
    };
  });
}

export async function resetAllLayouts() {
  if (process.env.NODE_ENV === 'production') return;
  if (saveDebounceTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}

  setState((prev) => ({
    ...prev,
    layouts: {},
    selectedIds: [],
    lastUngroupedIds: [],
    syncStatus: 'saving',
    past: pushHistorySnapshot(prev.layouts, prev.past),
    future: [],
  }));

  try {
    await fetch('/api/dev-layout', { method: 'DELETE' });
    setState((prev) => ({
      ...prev,
      syncStatus: 'saved',
      lastSavedAt: new Date().toLocaleTimeString(),
    }));
  } catch {
    setState((prev) => ({ ...prev, syncStatus: 'idle' }));
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function useDevModeStore() {
  useEffect(() => {
    initStoreOnClient();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlFlag = params.get('devMode');
      if (urlFlag === 'true' || urlFlag === '1') {
        toggleDevMode(true);
      }
    }
  }, []);

  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    ...snapshot,
    selectedId: snapshot.selectedIds[0] || null,
    canUndo: snapshot.past.length > 0,
    canRedo: snapshot.future.length > 0,
    undoCount: snapshot.past.length,
    redoCount: snapshot.future.length,
    undo,
    redo,
    toggleDevMode,
    setSelectedContainer,
    setSelectedContainers,
    groupSelectedContainers,
    ungroupSelectedContainers,
    regroupContainers,
    setCopiedPageClipboard,
    setCopiedSelectionClipboard,
    cloneScopeLayoutToScopes,
    updateSnapSettings,
    toggleMultiSelectMode,
    setInteractionMode,
    updateContainerLayout,
    updateMultipleContainerLayouts,
    resetContainerLayout,
    resetSelectedLayouts,
    resetAllLayouts,
    buildExportPayload: () => buildExportPayload(snapshot.layouts),
  };
}

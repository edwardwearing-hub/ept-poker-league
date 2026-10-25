'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Copy,
  Check,
  Code2,
  X,
  Move,
  Sparkles,
  HardDriveDownload,
  MousePointerClick,
  Layers,
  Maximize2,
  Hand,
  CheckSquare,
  ClipboardCopy,
  ClipboardPaste,
  Undo2,
  Redo2,
} from 'lucide-react';
import {
  useDevModeStore,
  ContainerLayoutConfig,
} from './DevModeContext';
import DevUniversalInspector, {
  ensureElementDevId,
  inferContainerLabel,
  buildCssSelectorPath,
  buildRelativeSelectorPath,
  getActivePageScopeInfo,
  captureCurrentPageLayoutClipboard,
  applyPageClipboardToCurrentPage,
} from './DevUniversalInspector';

export default function DevModeFloatingDock() {
  const {
    isDevMode,
    layouts,
    selectedIds,
    multiSelectMode,
    interactionMode,
    copiedPageClipboard,
    syncStatus,
    lastSavedAt,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    undo,
    redo,
    toggleDevMode,
    setSelectedContainers,
    setCopiedPageClipboard,
    toggleMultiSelectMode,
    setInteractionMode,
    updateMultipleContainerLayouts,
    resetAllLayouts,
    buildExportPayload,
  } = useDevModeStore();

  const [copied, setCopied] = useState(false);
  const [pageStatusMsg, setPageStatusMsg] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const modifiedCount = Object.keys(layouts).length;
  const selectedCount = selectedIds.length;

  const flashPageMsg = (msg: string) => {
    setPageStatusMsg(msg);
    window.setTimeout(() => {
      setPageStatusMsg((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const handleCopyConfig = async () => {
    const payload = buildExportPayload();
    const formatted = JSON.stringify(payload, null, 2);

    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = formatted;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleResetAll = async () => {
    await resetAllLayouts();
    window.dispatchEvent(new CustomEvent('ept_dev_layout_reset'));
  };

  const handleCopyPageFromDock = () => {
    const clip = captureCurrentPageLayoutClipboard(layouts, selectedIds);
    if (!clip) {
      flashPageMsg('Resize or select items on this page first');
      return;
    }
    setCopiedPageClipboard(clip);
    flashPageMsg(`Copied ${clip.items.length} item(s) from ${clip.sourceLabel}`);
  };

  const handlePastePageFromDock = () => {
    if (!copiedPageClipboard) return;
    const count = applyPageClipboardToCurrentPage(
      copiedPageClipboard,
      updateMultipleContainerLayouts
    );
    window.dispatchEvent(new CustomEvent('ept_dev_refresh_boxes'));
    flashPageMsg(
      count > 0
        ? `Pasted ${count} layout(s) onto this page!`
        : 'No matching containers found on this page'
    );
  };

  // Select All elements on current page/slide from the bottom dock
  const handleSelectAllFromDock = () => {
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
      flashPageMsg(`Selected all ${gatheredIds.size} elements!`);
    }
  };

  // Select all sibling elements in the same Grid/Flex container as the first selected element
  const handleSelectAllSiblingsFromDock = () => {
    if (selectedIds.length === 0 || typeof document === 'undefined') return;
    const primaryEl = document.querySelector(
      `[data-dev-container-id="${CSS.escape(selectedIds[0])}"]`
    ) as HTMLElement | null;
    if (!primaryEl || !primaryEl.parentElement) return;

    const siblingIds: string[] = [];
    Array.from(primaryEl.parentElement.children).forEach((child) => {
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
  };

  // Make all selected elements match the exact Width x Height of the first selected element
  const handleMatchSelectedSize = () => {
    if (selectedIds.length < 2 || typeof document === 'undefined') return;
    const primaryId = selectedIds[0];
    const primaryEl = document.querySelector(
      `[data-dev-container-id="${CSS.escape(primaryId)}"]`
    ) as HTMLElement | null;
    if (!primaryEl) return;

    const { scope } = getActivePageScopeInfo(primaryEl);
    const primaryRect = primaryEl.getBoundingClientRect();
    const targetW =
      layouts[primaryId]?.width ?? Math.round(primaryRect.width);
    const targetH =
      layouts[primaryId]?.height ?? Math.round(primaryRect.height);

    const patches: Record<string, Partial<ContainerLayoutConfig>> = {};
    for (const id of selectedIds) {
      const el = document.querySelector(
        `[data-dev-container-id="${CSS.escape(id)}"]`
      ) as HTMLElement | null;
      if (!el) continue;

      el.style.width = `${targetW}px`;
      el.style.maxWidth = 'none';
      el.style.height = `${targetH}px`;
      el.style.minHeight = `${targetH}px`;

      patches[id] = {
        label: layouts[id]?.label || inferContainerLabel(el),
        selector: buildCssSelectorPath(el),
        relativeSelector: buildRelativeSelectorPath(el),
        pageScope: scope,
        width: targetW,
        height: targetH,
      };
    }

    updateMultipleContainerLayouts(patches);
    window.dispatchEvent(new CustomEvent('ept_dev_refresh_boxes'));
  };

  if (!isDevMode) {
    return (
      <div
        data-dev-overlay="true"
        className="fixed bottom-3 right-3 z-[9990] print:hidden"
      >
        <button
          type="button"
          onClick={() => toggleDevMode(true)}
          title="Toggle Visual Dev Mode (Shortcut: Alt + D or ?devMode=true)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950/90 hover:bg-black border border-cyan-400/40 hover:border-[#ffd700] text-[11px] font-mono font-bold text-cyan-300 hover:text-[#ffd700] shadow-[0_4px_20px_rgba(0,0,0,0.85)] backdrop-blur-md transition cursor-pointer"
        >
          <Move size={12} className="text-[#ffd700]" />
          <span>Dev Mode</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-zinc-300 border border-white/15">
            Alt+D
          </kbd>
          {modifiedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#ffd700] text-black text-[9px] font-black">
              {modifiedCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  const exportPayload = buildExportPayload();

  return (
    <>
      {/* Universal Hover & Multi-Select Bounding Box Inspector */}
      <DevUniversalInspector />

      <div
        data-dev-overlay="true"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[9999] w-[96vw] max-w-6xl print:hidden select-none"
      >
        {/* Live Config Inspector Drawer */}
        {showInspector && (
          <div className="mb-2.5 rounded-2xl bg-zinc-950/95 border-2 border-cyan-400/60 shadow-[0_12px_45px_rgba(0,0,0,0.95)] backdrop-blur-xl p-4 text-xs font-mono text-zinc-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Code2 size={14} className="text-cyan-400" />
                <span className="font-black uppercase tracking-wider text-[#ffd700]">
                  Live Tailwind &amp; JSON Layout Map
                </span>
                <span className="text-[10px] text-zinc-400">
                  (Synced to <code>src/config/academy-layout.json</code>)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowInspector(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            {modifiedCount === 0 ? (
              <div className="py-4 text-center text-zinc-400">
                Click any element on the page (or Shift+Click / toggle Multi-Select) and drag its corner handles to generate Tailwind classes and JSON layout coordinates.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div className="text-[10px] font-bold uppercase text-cyan-300">
                  Tailwind Utility Mapping:
                </div>
                <div className="grid grid-cols-1 gap-1.5 bg-black/70 p-2.5 rounded-xl border border-white/10">
                  {Object.entries(exportPayload.tailwindClasses).map(
                    ([containerId, twClasses]) => (
                      <div
                        key={containerId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/5 last:border-0 pb-1 last:pb-0"
                      >
                        <span className="text-[#ffd700] font-bold">
                          {exportPayload.containers[containerId]?.label ||
                            containerId}
                          :
                        </span>
                        <code className="text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30 break-all">
                          {twClasses}
                        </code>
                      </div>
                    )
                  )}
                </div>

                <div className="text-[10px] font-bold uppercase text-zinc-400 pt-1">
                  Full JSON Config:
                </div>
                <pre className="bg-black/80 p-2.5 rounded-xl border border-white/10 text-[10px] text-emerald-300 overflow-x-auto">
                  {JSON.stringify(exportPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Main Floating Bottom Dock */}
        <div className="rounded-2xl bg-zinc-950/95 border-2 border-[#ffd700] ring-2 ring-cyan-400/50 shadow-[0_10px_40px_rgba(0,0,0,0.95)] backdrop-blur-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Status & Selection Mode Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#ffd700]/25 to-cyan-500/25 border border-[#ffd700] flex items-center justify-center text-[#ffd700] shadow-inner shrink-0">
                <Sparkles size={14} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-amber-200 to-cyan-300">
                    Dev Mode
                  </span>
                  <kbd className="px-1 py-0.2 rounded bg-white/10 border border-white/20 text-[9px] font-mono font-bold text-cyan-300">
                    Alt+D
                  </kbd>
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-mono font-black">
                    {selectedCount} Sel
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/40 text-[#ffd700] text-[9px] font-mono font-black">
                    {modifiedCount} Mod
                  </span>
                  {pageStatusMsg && (
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-200 text-[9px] font-mono font-bold animate-pulse">
                      {pageStatusMsg}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-400 mt-0.5">
                  <span>
                    Click to select • Right-Click for Arrange Menu • Copy/Paste across pages
                  </span>
                  {syncStatus !== 'idle' && (
                    <span className="hidden xl:inline-flex items-center gap-1 text-emerald-400">
                      <HardDriveDownload size={9} />
                      {syncStatus === 'saving'
                        ? 'Saving...'
                        : `Synced${lastSavedAt ? ` (${lastSavedAt})` : ''}`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Selection & Cross-Page Copy/Paste Controls */}
            <div className="flex items-center gap-1.5 border-l border-white/15 pl-2 flex-wrap">
              {/* Multi-Step History: Undo & Redo */}
              <button
                type="button"
                disabled={!canUndo}
                onClick={() => undo()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none border border-white/15 hover:border-amber-400/50 text-zinc-200 hover:text-[#ffd700] text-[11px] font-bold transition cursor-pointer active:scale-95"
                title={`Undo last action (Ctrl + Z)${undoCount > 0 ? ` • ${undoCount} step(s) available` : ''}`}
              >
                <Undo2 size={12} className={canUndo ? 'text-[#ffd700]' : 'text-zinc-500'} />
                <span>Undo</span>
                {undoCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-[#ffd700] text-[9px] font-mono font-bold">
                    {undoCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                disabled={!canRedo}
                onClick={() => redo()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none border border-white/15 hover:border-cyan-400/50 text-zinc-200 hover:text-cyan-300 text-[11px] font-bold transition cursor-pointer active:scale-95"
                title={`Redo next action (Ctrl + Y or Ctrl + Shift + Z)${redoCount > 0 ? ` • ${redoCount} step(s) available` : ''}`}
              >
                <Redo2 size={12} className={canRedo ? 'text-cyan-400' : 'text-zinc-500'} />
                <span>Redo</span>
                {redoCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 text-[9px] font-mono font-bold">
                    {redoCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setInteractionMode(
                    interactionMode === 'select' ? 'interact' : 'select'
                  )
                }
                className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                  interactionMode === 'select'
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'bg-zinc-900 border-white/15 text-zinc-300 hover:text-white'
                }`}
                title="Switch between clicking to select elements vs clicking normal page buttons"
              >
                {interactionMode === 'select' ? (
                  <>
                    <MousePointerClick size={12} className="text-cyan-300" />
                    <span>Select Mode</span>
                  </>
                ) : (
                  <>
                    <Hand size={12} className="text-amber-300" />
                    <span>Page Interact</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleMultiSelectMode()}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                  multiSelectMode
                    ? 'bg-[#ffd700] text-black border-[#ffd700] font-black shadow-[0_0_14px_rgba(255,215,0,0.45)]'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-white/15 text-zinc-300'
                }`}
                title="Sticky Multi-Select mode"
              >
                <CheckSquare size={12} />
                <span>Multi: {multiSelectMode ? 'ON' : 'OFF'}</span>
              </button>

              {/* Select All Elements on Current Page / Slide */}
              <button
                type="button"
                onClick={handleSelectAllFromDock}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 text-[11px] font-bold transition cursor-pointer"
                title="Select All Elements on this page/slide (Ctrl + A)"
              >
                <CheckSquare size={12} className="text-[#ffd700]" />
                <span>Select All</span>
              </button>

              {/* Copy Page Layout & Paste Page Layout right in the Bottom Dock */}
              <button
                type="button"
                onClick={handleCopyPageFromDock}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/50 text-[#ffd700] text-[11px] font-bold transition cursor-pointer"
                title="Copy all modified/selected layouts on this page/slide to paste onto another page"
              >
                <ClipboardCopy size={12} />
                <span>Copy Page</span>
              </button>

              <button
                type="button"
                disabled={!copiedPageClipboard}
                onClick={handlePastePageFromDock}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 disabled:opacity-35 disabled:pointer-events-none border border-emerald-400/60 text-emerald-200 text-[11px] font-bold transition cursor-pointer"
                title={
                  copiedPageClipboard
                    ? `Paste ${copiedPageClipboard.items.length} layout(s) copied from ${copiedPageClipboard.sourceLabel}`
                    : 'Copy a page layout first'
                }
              >
                <ClipboardPaste size={12} />
                <span>
                  Paste Page
                  {copiedPageClipboard
                    ? ` (${copiedPageClipboard.items.length})`
                    : ''}
                </span>
              </button>

              {selectedCount >= 1 && (
                <button
                  type="button"
                  onClick={handleSelectAllSiblingsFromDock}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-400/50 text-purple-200 text-[11px] font-bold transition cursor-pointer"
                  title="Select all sibling cards in the same Grid or Flex container"
                >
                  <Layers size={12} className="text-purple-300" />
                  <span>Siblings</span>
                </button>
              )}

              {selectedCount >= 2 && (
                <button
                  type="button"
                  onClick={handleMatchSelectedSize}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/60 text-emerald-200 text-[11px] font-bold transition cursor-pointer"
                  title="Make all selected elements match the exact same Width × Height as the first selected element"
                >
                  <Maximize2 size={12} className="text-emerald-300" />
                  <span>Match W×H</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Persistence & Export Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleResetAll}
              disabled={modifiedCount === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/80 disabled:opacity-40 disabled:pointer-events-none border border-white/15 hover:border-red-400/60 text-zinc-200 hover:text-red-200 text-[11px] font-bold transition cursor-pointer active:scale-95"
              title="Revert all containers to their initial styling and clear saved layout config"
            >
              <RotateCcw size={12} className="text-red-400" />
              <span>[ Reset ]</span>
            </button>

            <button
              type="button"
              onClick={handleCopyConfig}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-lg ${
                copied
                  ? 'bg-emerald-500 text-black border border-emerald-300'
                  : 'bg-gradient-to-r from-[#ffd700] via-[#ffe578] to-cyan-400 text-black hover:brightness-110'
              }`}
              title="Copy clean JSON & Tailwind class mapping of all modified sizes and positions"
            >
              {copied ? (
                <>
                  <Check size={12} strokeWidth={3} />
                  <span>[ Copied! ]</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>[ Copy Config ]</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowInspector((prev) => !prev)}
              className={`p-1.5 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                showInspector
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                  : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-300'
              }`}
              title="Inspect live Tailwind & JSON configuration"
            >
              <Code2 size={14} />
            </button>

            <button
              type="button"
              onClick={() => toggleDevMode(false)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Exit Visual Dev Mode (Alt + D)"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

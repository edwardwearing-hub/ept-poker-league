'use client';

import React, { useState } from 'react';
import { Calendar, Save, Trash2, Unlock, Image as ImageIcon, Upload, X, Link as LinkIcon, Sparkles } from 'lucide-react';
import MultiSelect from '@/components/MultiSelect';

const PLAYERS = [
    "Edward Wearing", "Georgina Wearing", "Luke Daly", "Daniel Horne",
    "Darren Daly", "Chris Daly", "Stephen Flood", "Dave Blackburn",
    "Liam Duxbury", "Nathen Benson", "Dave Taylor"
];

export default function AdminUpdate() {
    const [validationStatus, setValidationStatus] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [scheduleStatus, setScheduleStatus] = useState('');
    const [nextGameDate, setNextGameDate] = useState('');

    // Smart schedule state
    const [scheduleSource, setScheduleSource] = useState<'auto' | 'override' | ''>('');
    const [scheduledDates, setScheduledDates] = useState<{ raw: string; iso: string }[]>([]);
    const [activeTargetDate, setActiveTargetDate] = useState('');
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [clearingOverride, setClearingOverride] = useState(false);

    // Game Report State
    const [reportStatus, setReportStatus] = useState('');
    const [reportTitle, setReportTitle] = useState('"The Flop"');
    const [reportEpisode, setReportEpisode] = useState('Episode 1');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportWinner, setReportWinner] = useState('');
    const [reportContent, setReportContent] = useState('');
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [isStoryAiRefined, setIsStoryAiRefined] = useState(false);

    // Picture State (Custom photo vs revert to Champion video)
    const [reportImageUrl, setReportImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCompressingImage, setIsCompressingImage] = useState(false);

    // Hijack Management State
    const [selectedResetPlayer, setSelectedResetPlayer] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    // PIN Management State
    const [selectedPinResetPlayer, setSelectedPinResetPlayer] = useState('');
    const [pinResetMessage, setPinResetMessage] = useState('');

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleValidation = async () => {
        setIsValidating(true);
        setValidationStatus('Checking math logic against Google Sheet API...');
        try {
            const res = await fetch('/api/admin/validate');
            const data = await res.json();
            if (res.ok) {
                setValidationStatus('Success! No mathematical discrepancies found.');
            } else {
                setValidationStatus(`Warning: ${data.error || 'Prize pool mismatch detected.'}`);
            }
        } catch (e) {
            setValidationStatus('Validation check failed to ping Google API.');
        } finally {
            setIsValidating(false);
        }
    };



    const handleScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setScheduleStatus('Updating...');
        try {
            const response = await fetch('/api/admin/countdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetDate: new Date(nextGameDate).toISOString() })
            });
            if (response.ok) {
                setScheduleStatus('Override set successfully! Refresh to confirm.');
                loadSchedule();
            } else {
                setScheduleStatus('Error updating countdown.');
            }
        } catch (err) {
            console.error(err);
            setScheduleStatus('Failed to update.');
        }
    };

    const loadSchedule = async () => {
        setLoadingSchedule(true);
        try {
            const res = await fetch('/api/admin/countdown');
            const data = await res.json();
            setActiveTargetDate(data.targetDate || '');
            setScheduleSource(data.source === 'override' ? 'override' : 'auto');
            setScheduledDates(data.allScheduledDates || []);
        } catch (e) {
            console.error('Failed to load schedule', e);
        } finally {
            setLoadingSchedule(false);
        }
    };

    const handleClearOverride = async () => {
        setClearingOverride(true);
        try {
            const res = await fetch('/api/admin/countdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clear: true })
            });
            if (res.ok) {
                setScheduleStatus('Override cleared — reverting to auto schedule.');
                setNextGameDate('');
                loadSchedule();
            } else {
                setScheduleStatus('Failed to clear override.');
            }
        } catch (e) {
            setScheduleStatus('Network error.');
        } finally {
            setClearingOverride(false);
        }
    };

    // Load schedule on mount (after login)
    React.useEffect(() => {
        if (isLoggedIn) loadSchedule();
    }, [isLoggedIn]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCompressingImage(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Fit within 600px width/height to keep base64 string lightweight (< 35KB)
                const MAX_SIZE = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.65);
                    setReportImageUrl(base64);
                    setImagePreview(base64);
                }
                setIsCompressingImage(false);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleClearImage = () => {
        setReportImageUrl('');
        setImagePreview(null);
    };

    const handleGenerateAiStory = async () => {
        if (!reportContent.trim()) {
            setReportStatus('Please enter notes or bullet points first before generating with AI.');
            return;
        }
        setIsGeneratingAi(true);
        setReportStatus('Journalist AI is reviewing standings & drafting your recap...');
        try {
            const response = await fetch('/api/admin/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate',
                    content: reportContent
                })
            });
            const data = await response.json();
            if (response.ok && data.generatedText) {
                setReportContent(data.generatedText);
                setIsStoryAiRefined(true);
                setReportStatus('✨ AI story generated! Review, make tweaks if you like, then click Publish Report.');
            } else {
                setReportStatus(`AI Notice: ${data.error || 'Failed to generate story'}`);
            }
        } catch (err) {
            console.error(err);
            setReportStatus('Failed to generate story (Network error).');
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setReportStatus('Publishing...');
        try {
            const response = await fetch('/api/admin/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: reportTitle,
                    episode: reportEpisode,
                    date: reportDate,
                    winner: reportWinner,
                    content: reportContent,
                    imageUrl: reportImageUrl,
                    autoGenerate: !isStoryAiRefined
                })
            });
            const data = await response.json();

            if (response.ok) {
                if (data.aiFallbackMsg) {
                    setReportStatus(`Warning: ${data.aiFallbackMsg}`);
                } else {
                    setReportStatus('Report published successfully!');
                }
            } else {
                setReportStatus(`Error: ${data.error || 'Failed to publish report.'}`);
            }
        } catch (err) {
            console.error(err);
            setReportStatus('Failed to publish (Network error).');
        }
    };

    const handleResetHijack = () => {
        if (!selectedResetPlayer) return;
        localStorage.removeItem(`hijack_active_${selectedResetPlayer}`);
        localStorage.removeItem(`hijack_lockout_${selectedResetPlayer}`);
        localStorage.removeItem(`hijack_defeated_${selectedResetPlayer}`);
        setResetMessage(`${selectedResetPlayer}'s hijack state has been completely reset.`);
        setTimeout(() => setResetMessage(''), 4000);
    };

    const handleResetPin = async () => {
        if (!selectedPinResetPlayer) return;
        
        try {
            const res = await fetch('/api/auth/pin-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: selectedPinResetPlayer, newPin: '0000' })
            });
            
            if (res.ok) {
                setPinResetMessage(`${selectedPinResetPlayer}'s PIN has been reset to 0000.`);
            } else {
                setPinResetMessage(`Failed to reset PIN for ${selectedPinResetPlayer}.`);
            }
        } catch (e) {
            setPinResetMessage(`Error connecting to server.`);
        }
        
        setTimeout(() => setPinResetMessage(''), 4000);
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#1c1c1c] flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black z-0 opacity-80" />

                <div className="bg-black/80 px-8 py-12 rounded-3xl border border-[#cfb53b]/30 w-full max-w-md shadow-[0_0_50px_rgba(255,215,0,0.1)] relative z-10 text-center backdrop-blur-md">
                    <div className="w-16 h-16 bg-[#cfb53b]/20 border border-[#cfb53b] rounded-full flex items-center justify-center mx-auto mb-6 text-[#ffd700]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>

                    <h1 className="text-3xl text-[#ffd700] mb-2 uppercase tracking-widest font-black">Admin Access</h1>
                    <p className="text-gray-400 mb-8 font-light tracking-wide text-sm">Secure Entry Required</p>

                    {loginError && <p className="text-[#ff073a] mb-4 text-sm font-bold bg-red-900/20 p-2 rounded">{loginError}</p>}

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (passwordInput === 'ept2026') {
                            setIsLoggedIn(true);
                            setLoginError('');
                        } else {
                            setLoginError('Incorrect password');
                            setPasswordInput('');
                        }
                    }} className="space-y-6">
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="•••••••"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-white focus:border-[#cfb53b] outline-none tracking-[0.5em] text-center text-xl shadow-inner transition"
                            required
                        />
                        <button type="submit" className="w-full py-4 bg-[#cfb53b] hover:bg-[#ffd700] text-black font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] transition duration-300">
                            Authenticate
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1c1c1c] text-white p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
                <h1 className="text-3xl md:text-4xl text-[#ffd700] uppercase tracking-widest text-center">E.P.T. Admin Console</h1>

                {/* Scheduling Section */}
                <div className="bg-black/50 p-4 md:p-8 rounded-2xl border border-[#cfb53b]/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent opacity-50" />
                    <h2 className="text-xl md:text-2xl font-black text-white mb-4 md:mb-6 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-[#ff073a] animate-pulse" />
                        Schedule Next Game
                    </h2>

                    {scheduleStatus && (
                        <div className="mb-4 p-3 rounded bg-gray-800 border border-gray-700 text-[#ffd700] font-bold text-sm">
                            {scheduleStatus}
                        </div>
                    )}

                    {/* Current active countdown */}
                    {activeTargetDate && (
                        <div className="mb-6 p-4 rounded-xl bg-gray-900 border border-[#cfb53b]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">
                                    {scheduleSource === 'override' ? '⚠ Manual Override Active' : '✓ Auto Schedule Active'}
                                </div>
                                <div className="text-[#ffd700] font-black text-lg">
                                    {new Date(activeTargetDate).toLocaleString('en-GB', {
                                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                            {scheduleSource === 'override' && (
                                <button
                                    onClick={handleClearOverride}
                                    disabled={clearingOverride}
                                    className="px-4 py-2 text-sm font-bold uppercase tracking-widest bg-gray-800 hover:bg-red-900/30 border border-gray-600 hover:border-red-500 text-gray-400 hover:text-red-400 rounded-lg transition"
                                >
                                    {clearingOverride ? 'Clearing...' : 'Clear Override → Auto'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Auto schedule preview */}
                    {scheduledDates.length > 0 && (
                        <div className="mb-6">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">Remaining Games from Sheet (B22:AC22)</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {scheduledDates.map((d, i) => {
                                    const isPast = new Date(d.iso) < new Date();
                                    const isActive = d.iso === activeTargetDate;
                                    return (
                                        <div key={i} className={`p-2 rounded-lg text-center text-xs font-bold border ${
                                            isActive ? 'border-[#cfb53b] bg-[#cfb53b]/10 text-[#ffd700]'
                                            : isPast ? 'border-gray-800 bg-gray-900/30 text-gray-600 line-through'
                                            : 'border-gray-700 bg-gray-900/50 text-gray-300'
                                        }`}>
                                            {new Date(d.iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                            {isActive && <div className="text-[9px] text-[#ffd700] mt-0.5">▶ Next</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {loadingSchedule && (
                        <div className="text-gray-500 text-sm mb-4">Loading schedule from sheet...</div>
                    )}

                    {/* Override form */}
                    <details className="group">
                        <summary className="cursor-pointer text-sm font-bold text-gray-500 hover:text-[#ffd700] uppercase tracking-widest mb-4 transition list-none flex items-center gap-2">
                            <span className="text-[#ffd700]">[+]</span> Set Manual Override Date
                        </summary>
                        <form onSubmit={handleScheduleSubmit} className="flex flex-col md:flex-row gap-4 items-end mt-4">
                            <div className="flex-1 w-full">
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Override Date &amp; Time</label>
                                <input
                                    type="datetime-local"
                                    value={nextGameDate}
                                    onChange={e => setNextGameDate(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full md:w-auto px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-[#cfb53b] text-[#ffd700] font-bold uppercase tracking-widest rounded-lg transition shadow-md">
                                Set Override
                            </button>
                        </form>
                    </details>
                </div>

                {/* Game Report Editor Section */}
                <div className="bg-black/50 p-4 md:p-8 rounded-2xl border border-[#cfb53b]/30 relative overflow-hidden">
                    <h2 className="text-xl md:text-2xl font-black text-white mb-4 md:mb-6 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Latest Gazette Editor
                    </h2>

                    {reportStatus && (
                        <div className="mb-4 p-3 rounded bg-gray-800 border border-gray-700 text-[#ffd700] font-bold text-sm">
                            {reportStatus}
                        </div>
                    )}

                    <form onSubmit={handleReportSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Report Title</label>
                                <input
                                    type="text"
                                    value={reportTitle}
                                    onChange={e => setReportTitle(e.target.value)}
                                    placeholder='"The Flop"'
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Episode</label>
                                <input
                                    type="text"
                                    value={reportEpisode}
                                    onChange={e => setReportEpisode(e.target.value)}
                                    placeholder='Episode 2'
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Report Date</label>
                                <input
                                    type="text"
                                    value={reportDate}
                                    onChange={e => setReportDate(e.target.value)}
                                    placeholder='January 24, 2026'
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Winner (For Video Background)</label>
                                <select
                                    value={reportWinner}
                                    onChange={e => setReportWinner(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner"
                                    required
                                >
                                    <option value="" disabled>Select Winner</option>
                                    {PLAYERS.map((p: string) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Gazette Feature Picture Section */}
                        <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-700/60 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <label className="text-sm text-gray-300 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-[#ffd700]" />
                                    Gazette Feature Picture (Optional)
                                </label>
                                <span className="text-[10px] text-gray-500 font-mono">
                                    {reportImageUrl ? '✓ Picture Attached' : 'Reverts to Champion Video if empty'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Option A: Upload from computer/phone */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                                        Upload From Device
                                    </label>
                                    <label className="flex items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 hover:border-[#ffd700] rounded-lg cursor-pointer transition text-gray-300 hover:text-white text-xs font-bold">
                                        <Upload className="w-4 h-4 text-[#ffd700]" />
                                        <span>{isCompressingImage ? 'Optimizing Picture...' : 'Choose Picture File'}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isCompressingImage}
                                        />
                                    </label>
                                </div>

                                {/* Option B: Paste direct URL */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                                        Or Paste Direct Image Link
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={reportImageUrl.startsWith('data:') ? '' : reportImageUrl}
                                            onChange={e => {
                                                const url = e.target.value.trim();
                                                setReportImageUrl(url);
                                                setImagePreview(url || null);
                                            }}
                                            placeholder="https://example.com/photo.jpg"
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-xs focus:border-[#cfb53b] outline-none shadow-inner pr-8"
                                        />
                                        <LinkIcon className="w-4 h-4 text-gray-500 absolute right-3 top-3.5 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview & Revert Button */}
                            {imagePreview && (
                                <div className="mt-3 p-3 bg-black/60 rounded-lg border border-[#cfb53b]/40 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-800 border border-white/10 shrink-0">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                Custom Picture Attached
                                            </div>
                                            <div className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                                                Will display on home page &amp; Gazette issue
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleClearImage}
                                        className="shrink-0 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 hover:text-red-100 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Remove (Revert)</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <label className="block text-sm text-gray-400 font-bold uppercase tracking-wider">
                                    Gazette Content (Notes or Story)
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateAiStory}
                                    disabled={isGeneratingAi || !reportContent.trim()}
                                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black text-xs font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer"
                                >
                                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                                    <span>{isGeneratingAi ? 'Writing Story...' : '⚡ Generate Story with AI'}</span>
                                </button>
                            </div>
                            <textarea
                                value={reportContent}
                                onChange={e => {
                                    setReportContent(e.target.value);
                                    setIsStoryAiRefined(false);
                                }}
                                rows={7}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner leading-relaxed"
                                placeholder="Enter game bullet points (e.g. Luke won with river bluff, Edward went all-in on K3) or draft directly..."
                                required
                            />
                            {isStoryAiRefined && (
                                <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1.5 font-mono">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    AI story drafted. You can edit any sentences before publishing.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" className="px-8 py-3 bg-[#cfb53b] hover:bg-[#ffd700] text-black font-black uppercase tracking-widest rounded-lg transition shadow-[0_0_15px_rgba(212,175,55,0.4)] cursor-pointer">
                                Publish Report
                            </button>
                        </div>
                    </form>
                </div>

                {/* Player Hijack Management Section */}
                <div className="bg-black/50 p-4 md:p-8 rounded-2xl border border-[#cfb53b]/30 relative overflow-hidden">
                    <h2 className="text-xl md:text-2xl font-black text-white mb-4 md:mb-6 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Player Hijack Management
                    </h2>

                    {resetMessage && (
                        <div className="mb-4 p-3 rounded bg-green-900/20 border border-green-500/50 text-green-400 font-bold text-sm">
                            {resetMessage}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Select Player to Reset</label>
                            <select
                                value={selectedResetPlayer}
                                onChange={e => setSelectedResetPlayer(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner"
                            >
                                <option value="" disabled>Choose Player...</option>
                                {PLAYERS.map((p: string) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleResetHijack}
                            disabled={!selectedResetPlayer}
                            className="w-full md:w-auto px-8 py-3 bg-gray-800 disabled:opacity-50 hover:bg-red-900/50 hover:text-white border border-gray-600 hover:border-ept-red text-ept-red font-bold uppercase tracking-widest rounded-lg transition shadow-md flex items-center justify-center gap-2"
                        >
                            <Unlock className="w-4 h-4" /> Reset Status
                        </button>
                    </div>
                </div>

                {/* Player Security Management Section */}
                <div className="bg-black/50 p-4 md:p-8 rounded-2xl border border-[#cfb53b]/30 relative overflow-hidden">
                    <h2 className="text-xl md:text-2xl font-black text-white mb-4 md:mb-6 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Player Security Management
                    </h2>

                    {pinResetMessage && (
                        <div className="mb-4 p-3 rounded bg-blue-900/20 border border-blue-500/50 text-blue-400 font-bold text-sm">
                            {pinResetMessage}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Select Player to Reset PIN to 0000</label>
                            <select
                                value={selectedPinResetPlayer}
                                onChange={e => setSelectedPinResetPlayer(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner"
                            >
                                <option value="" disabled>Choose Player...</option>
                                {PLAYERS.map((p: string) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleResetPin}
                            disabled={!selectedPinResetPlayer}
                            className="w-full md:w-auto px-8 py-3 bg-gray-800 disabled:opacity-50 hover:bg-blue-900/50 hover:text-white border border-gray-600 hover:border-blue-500 text-blue-400 font-bold uppercase tracking-widest rounded-lg transition shadow-md flex items-center justify-center gap-2"
                        >
                            <Unlock className="w-4 h-4" /> Reset PIN
                        </button>
                    </div>
                </div>

                {/* Google Sheet Direct Embed */}
                <div className="bg-black/50 p-4 md:p-8 rounded-2xl border border-gray-800 relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live E.P.T. Database
                        </h2>
                        <button
                            onClick={handleValidation}
                            disabled={isValidating}
                            className="w-full md:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 text-[#ffd700] px-4 py-3 md:py-2 font-bold uppercase rounded shadow transition text-sm md:text-base"
                        >
                            {isValidating ? 'Checking...' : 'Run Math Validation Validation'}
                        </button>
                    </div>

                    {validationStatus && (
                        <div className={`mb-6 p-4 rounded font-bold text-center border ${validationStatus.includes('Warning') || validationStatus.includes('failed') ? 'bg-red-900/20 border-red-500/50 text-[#ff073a]' : 'bg-green-900/20 border-green-500/50 text-green-400'}`}>
                            {validationStatus}
                        </div>
                    )}

                    <div className="w-full flex flex-col md:flex-row items-center justify-center p-8 bg-gray-900 border border-gray-700 rounded-xl gap-6 mt-4">
                        <div className="text-center md:text-left">
                            <p className="text-gray-300 font-bold mb-2">Google restricts embedding the editor directly inside other sites.</p>
                            <p className="text-gray-500 text-sm">Please open the database in a new tab to make direct manual edits.</p>
                        </div>
                        <a 
                            href="https://docs.google.com/spreadsheets/d/1YFGSRvFcdbwQKb_ZbfEV8aR_-w2uW1naDQbJNRqsXB0/edit" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white font-black uppercase tracking-widest rounded shadow-lg transition whitespace-nowrap"
                        >
                            Open Google Sheet
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { Calendar, Save, Trash2 } from 'lucide-react';
import MultiSelect from '@/components/MultiSelect';

const PLAYERS = [
    "Edward Wearing", "Georgina Wearing", "Luke Daly", "Daniel Horne",
    "Darren Daly", "Chris Daly", "Stephen Flood", "Phil Landsberger",
    "Liam Duxbury", "Nathen Benson", "Dave Taylor"
];

export default function AdminUpdate() {
    const [validationStatus, setValidationStatus] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [scheduleStatus, setScheduleStatus] = useState('');
    const [nextGameDate, setNextGameDate] = useState('');

    // Game Report State
    const [reportStatus, setReportStatus] = useState('');
    const [reportTitle, setReportTitle] = useState('"The Flop"');
    const [reportEpisode, setReportEpisode] = useState('Episode 1');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportWinner, setReportWinner] = useState('Edward Wearing');
    const [reportContent, setReportContent] = useState('');

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
                setScheduleStatus('Countdown updated successfully!');
            } else {
                setScheduleStatus('Error updating countdown.');
            }
        } catch (err) {
            console.error(err);
            setScheduleStatus('Failed to update.');
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
                    content: reportContent
                })
            });
            if (response.ok) {
                setReportStatus('Report published successfully!');
            } else {
                setReportStatus('Error publishing report.');
            }
        } catch (err) {
            console.error(err);
            setReportStatus('Failed to publish.');
        }
    };

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

                    <form onSubmit={handleScheduleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Target Date & Time</label>
                            <input
                                type="datetime-local"
                                value={nextGameDate}
                                onChange={e => setNextGameDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full md:w-auto px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-[#cfb53b] text-[#ffd700] font-bold uppercase tracking-widest rounded-lg transition shadow-md">
                            Update Countdown
                        </button>
                    </form>
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
                                >
                                    {PLAYERS.map((p: string) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Gazette Content (Notes)</label>
                            <textarea
                                value={reportContent}
                                onChange={e => setReportContent(e.target.value)}
                                rows={6}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#cfb53b] outline-none shadow-inner leading-relaxed"
                                placeholder="Enter the dramatic retelling here... Newlines are respected."
                                required
                            />
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" className="px-8 py-3 bg-[#cfb53b] hover:bg-[#ffd700] text-black font-black uppercase tracking-widest rounded-lg transition shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                                Publish Report
                            </button>
                        </div>
                    </form>
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

                    <div className="w-full h-[600px] md:h-[800px] rounded-lg overflow-x-auto border border-gray-700 mt-4 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
                        <iframe
                            src="https://docs.google.com/spreadsheets/d/1YFGSRvFcdbwQKb_ZbfEV8aR_-w2uW1naDQbJNRqsXB0/edit?rm=minimal"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            className="bg-white min-w-[800px]"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
}

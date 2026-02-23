'use client';
import React, { useState } from 'react';

const QUESTIONS = [
    {
        question: "You have Ac-Kc pre-flop. What is the approximate probability you will make at least a pair on the flop?",
        options: ["10%", "32%", "50%", "15%"],
        answer: 1 // 32%
    },
    {
        question: "Which player holds the current record for highest winnings in a single game in the 2026 season?",
        options: ["Luke Daly", "Edward Wearing", "Phil Landsberger", "Liam Duxbury"],
        answer: 1 // Example, assuming Edward based on context
    },
    {
        question: "You have J-10 suited on a 9-8-2 rainbow flop (Open Ended Straight Draw). How many outs do you have?",
        options: ["4", "6", "8", "12"],
        answer: 2 // 8 outs
    }
];

export default function StrategyQuiz() {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
    const [reveal, setReveal] = useState(false);

    const handleSelect = (idx: number) => {
        if (reveal) return; // prevent multiple clicks
        setSelectedOpt(idx);
        setReveal(true);

        if (idx === QUESTIONS[currentQ].answer) {
            setScore(s => s + 1);
        }

        setTimeout(() => {
            if (currentQ < QUESTIONS.length - 1) {
                setCurrentQ(q => q + 1);
                setSelectedOpt(null);
                setReveal(false);
            } else {
                setShowResult(true);
            }
        }, 1500);
    };

    const reset = () => {
        setCurrentQ(0);
        setScore(0);
        setShowResult(false);
        setSelectedOpt(null);
        setReveal(false);
    };

    return (
        <div className="bg-black/40 border border-[#cfb53b]/20 p-6 rounded-xl shadow-lg h-full flex flex-col">
            <h2 className="text-2xl font-bold text-[#ffd700] mb-6 border-b border-[#cfb53b]/30 pb-2">Strategy & Math Quiz</h2>

            {showResult ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="text-6xl mb-4">{score === QUESTIONS.length ? '🦈' : '🐠'}</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h3>
                    <p className="text-gray-400 mb-6">You scored <span className="text-[#ff073a] font-bold text-xl">{score}</span> out of {QUESTIONS.length}</p>
                    <button
                        onClick={reset}
                        className="px-6 py-2 bg-gray-800 hover:bg-[#ff073a] text-white rounded transition font-bold"
                    >
                        Retake Quiz
                    </button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="text-sm font-bold text-gray-500 tracking-widest mb-4">QUESTION {currentQ + 1} OF {QUESTIONS.length}</div>
                    <h3 className="text-lg text-white mb-6 leading-relaxed">{QUESTIONS[currentQ].question}</h3>

                    <div className="space-y-3 mt-auto">
                        {QUESTIONS[currentQ].options.map((opt, idx) => {
                            let btnClass = "w-full text-left p-4 rounded-lg border transition font-medium ";
                            if (!reveal) {
                                btnClass += "bg-gray-900 border-gray-700 hover:border-[#cfb53b] text-white";
                            } else {
                                if (idx === QUESTIONS[currentQ].answer) {
                                    btnClass += "bg-green-900/50 border-green-500 text-green-400"; // Correct answer is always highlighted
                                } else if (idx === selectedOpt && idx !== QUESTIONS[currentQ].answer) {
                                    btnClass += "bg-red-900/50 border-red-500 text-red-400"; // Incorrect selected
                                } else {
                                    btnClass += "bg-gray-900 border-gray-700 text-gray-500 opacity-50"; // Unselected wrong
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    disabled={reveal}
                                    className={btnClass}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

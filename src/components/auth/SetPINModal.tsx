'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, ChevronRight, X, AlertCircle } from 'lucide-react';

interface Props {
    playerName: string;
    onSuccess: (newPin: string) => void;
    onCancel?: () => void;
    isMandatory?: boolean;
}

export default function SetPINModal({ playerName, onSuccess, onCancel, isMandatory }: Props) {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState(1); // 1: Enter, 2: Confirm
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNumberClick = (num: number) => {
        setError('');
        if (step === 1 && pin.length < 4) setPin(prev => prev + num);
        if (step === 2 && confirmPin.length < 4) setConfirmPin(prev => prev + num);
    };

    const handleDelete = () => {
        if (step === 1) setPin(prev => prev.slice(0, -1));
        if (step === 2) setConfirmPin(prev => prev.slice(0, -1));
    };

    const handleContinue = async () => {
        if (step === 1) {
            if (pin.length !== 4) {
                setError('PLEASE ENTER 4 DIGITS');
                return;
            }
            if (pin === '0000') {
                setError('CANNOT USE DEFAULT PIN');
                setPin('');
                return;
            }
            setStep(2);
        } else {
            if (confirmPin !== pin) {
                setError('PINS DO NOT MATCH');
                setConfirmPin('');
                return;
            }

            setIsSubmitting(true);
            try {
                const res = await fetch('/api/auth/pin-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerName, newPin: pin })
                });

                if (res.ok) {
                    onSuccess(pin);
                } else {
                    const data = await res.json();
                    setError(data.error || 'UPDATE FAILED');
                }
            } catch (err) {
                setError('CONNECTION ERROR');
            }
            setIsSubmitting(false);
        }
    };

    const currentVal = step === 1 ? pin : confirmPin;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-zinc-900 border-4 border-zinc-800 max-w-sm w-full relative overflow-hidden"
            >
                {/* Header */}
                <div className="bg-black p-4 border-b-4 border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-gold" />
                        <h2 className="text-sm font-black text-white uppercase tracking-tighter italic">
                            {isMandatory ? 'Setup Your Secret PIN' : 'Change Your PIN'}
                        </h2>
                    </div>
                    {!isMandatory && onCancel && (
                        <button onClick={onCancel} className="text-zinc-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    <div className="text-center mb-8">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                            {step === 1 ? 'STEP 1: CHOOSE PIN' : 'STEP 2: CONFIRM PIN'}
                        </div>
                        <h3 className="text-white font-bold text-sm mb-4">
                            {step === 1
                                ? "Create a 4-digit code to protect your profile"
                                : "Repeat the code to verify"}
                        </h3>

                        {/* PIN Display */}
                        <div className="flex justify-center gap-4 mb-2">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={`w-12 h-14 border-2 flex items-center justify-center text-2xl font-black transition-all
                                        ${currentVal[i] ? 'border-gold text-white bg-gold/10' : 'border-zinc-800 text-zinc-800'}`}
                                >
                                    {currentVal[i] ? '*' : '-'}
                                </div>
                            ))}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-ept-red text-[10px] font-black uppercase flex items-center justify-center gap-1"
                            >
                                <AlertCircle className="w-3 h-3" /> {error}
                            </motion.div>
                        )}
                    </div>

                    {/* Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'DEL', 0, 'OK'].map((btn, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (btn === 'DEL') handleDelete();
                                    else if (btn === 'OK') handleContinue();
                                    else if (typeof btn === 'number') handleNumberClick(btn);
                                }}
                                disabled={isSubmitting}
                                className={`
                                    h-14 flex items-center justify-center font-black text-lg transition-all
                                    ${typeof btn === 'number'
                                        ? 'bg-zinc-800/50 text-white hover:bg-zinc-700'
                                        : btn === 'OK'
                                            ? 'bg-gold text-black hover:bg-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:text-white'}
                                    disabled:opacity-50
                                `}
                            >
                                {btn}
                            </button>
                        ))}
                    </div>

                    <p className="text-[9px] text-zinc-600 text-center uppercase font-bold leading-tight">
                        Do not forget this code. <br />It is required for every login.
                    </p>
                </div>

                {/* Loading HUD */}
                {isSubmitting && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-50">
                        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                        <div className="text-[10px] font-black text-gold uppercase animate-pulse">Updating System...</div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

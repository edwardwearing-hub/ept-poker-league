import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
}

export default function MultiSelect({ options, selected, onChange, placeholder = "Select..." }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        const isSelected = selected.includes(option);
        if (isSelected) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const removeOption = (e: React.MouseEvent, option: string) => {
        e.stopPropagation();
        onChange(selected.filter(item => item !== option));
    };

    return (
        <div className="relative w-48 text-left" ref={containerRef}>
            {/* The Select Box */}
            <div
                className="min-h-[36px] bg-gray-900 border border-gray-700 rounded p-1 flex flex-wrap items-center gap-1 cursor-pointer focus-within:border-[#ff073a] transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selected.length === 0 ? (
                    <span className="text-gray-500 text-sm px-2">{placeholder}</span>
                ) : (
                    selected.map(item => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-1 bg-[#ff073a]/20 text-white text-xs px-2 py-0.5 rounded border border-[#ff073a]/30"
                        >
                            {item.split(' ')[0]} {/* Show just first name to save space */}
                            <button
                                onClick={(e) => removeOption(e, item)}
                                className="text-gray-400 hover:text-white focus:outline-none"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))
                )}

                <div className="ml-auto px-1 text-gray-500">
                    <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* The Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-64 mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    <div className="max-h-60 overflow-y-auto">
                        {options.map((option) => {
                            const isSelected = selected.includes(option);
                            return (
                                <div
                                    key={option}
                                    className={`px-3 py-2 text-sm cursor-pointer flex items-center hover:bg-gray-800 transition-colors ${isSelected ? 'text-[#ff073a]' : 'text-gray-300'}`}
                                    onClick={() => toggleOption(option)}
                                >
                                    <div className={`w-4 h-4 mr-3 border rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-[#ff073a] border-[#ff073a]' : 'border-gray-600'}`}>
                                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <span>{option}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

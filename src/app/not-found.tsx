import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-ept-red/10 border-2 border-ept-red rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(230,57,70,0.2)]">
                <AlertTriangle size={48} className="text-ept-red" />
            </div>

            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 mb-4 tracking-tighter uppercase">
                404
            </h1>

            <h2 className="text-2xl font-bold text-gold mb-6 uppercase tracking-widest">
                Dead Hand
            </h2>

            <p className="text-gray-400 max-w-md mb-10 text-lg">
                The table you're looking for doesn't exist, has been moved, or the dealer misdealt the cards.
            </p>

            <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gold hover:bg-[#ffe578] text-black font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
                <Home size={20} />
                Return to League Home
            </Link>
        </div>
    );
}

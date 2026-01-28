import StatCorner from "@/components/StatCorner";

export default function StatsPage() {
    return (
        <div className="space-y-8 animate-in float-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-extrabold text-white text-center mb-8 tracking-tight">
                League <span className="text-gold">Statistics</span>
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <StatCorner />

                {/* Additional Placeholders for future stats */}
                <div className="glass-panel p-6 rounded-xl border border-white/5 bg-zinc-900/50">
                    <h3 className="text-xl font-bold text-zinc-400 mb-4">Season Highs</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-zinc-500">Biggest Pot</span>
                            <span className="text-gold font-mono">£200</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-zinc-500">Most KOs (Single Game)</span>
                            <span className="text-ept-red font-mono">5 ☠️</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

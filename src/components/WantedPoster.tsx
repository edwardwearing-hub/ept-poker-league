
import { getLeaderboardData } from "@/lib/data";
import WantedVideo from "./WantedVideo";

export default async function WantedPoster() {
    const players = await getLeaderboardData();
    const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
    const target = sortedPlayers[0];
    const rivals = sortedPlayers.slice(1, 8);

    return (
        <div className="bg-[#e4dccb] text-[#3e3221] p-1 rounded-sm shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="border-[3px] border-[#3e3221] p-4 flex flex-col items-center">
                <h3 className="text-4xl font-extrabold tracking-widest uppercase mb-2" style={{ fontFamily: 'serif' }}>Wanted</h3>
                <div className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-[#3e3221] pb-1 w-full text-center">
                    Dead or Alive
                </div>

                <div className="w-32 h-32 bg-zinc-800 border-2 border-[#3e3221] flex items-center justify-center overflow-hidden relative group">
                    {/* Video Background Layer (Client Component) */}
                    {target?.name && <WantedVideo playerName={target.name} />}

                    {/* Fallback Layer (Letter) */}
                    <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center z-0">
                        <span className="text-4xl text-white font-serif">{target?.name?.charAt(0)}</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold uppercase mb-1 text-center leading-none">{target?.name}</h2>
                <p className="text-xs uppercase font-bold text-[#3e3221]/70 mb-4">The &quot;Bounty&quot; Hunter</p>

                <div className="w-full border-t-2 border-b-2 border-[#3e3221] py-2 mb-4 text-center">
                    <div className="text-xs uppercase font-bold">Current Bounty</div>
                    <div className="text-3xl font-extrabold">{target?.points} <span className="text-sm">PTS</span></div>
                </div>

                <div className="w-full text-left">
                    <h4 className="text-xs font-bold uppercase mb-2 border-b border-[#3e3221]/30">Known Rivals ({rivals.length})</h4>
                    <div className="flex flex-wrap gap-1">
                        {rivals.map(rival => (
                            <span key={rival.name} className="px-1.5 py-0.5 bg-[#3e3221] text-[#e4dccb] text-[10px] font-bold uppercase rounded-sm">
                                {rival.name.split(' ')[0]}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { SearchX } from "lucide-react";

export default function NoFoodsFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-transparent">
      <div className="bg-orange-100 dark:bg-orange-500/10 p-5 rounded-3xl mb-6">
        <SearchX className="w-12 h-12 text-orange-500" />
      </div>

      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">
        No <span className="text-orange-600">Foods</span> Found
      </h2>

      <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-center max-w-[280px] text-xs font-bold uppercase tracking-widest leading-relaxed">
        We couldn't find any results. Try adjusting your search term.
      </p>

      <button
        onClick={() => window.location.href = '/home'}
        className="mt-8 px-8 py-3 bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-orange-600 dark:hover:bg-orange-600 transition-all duration-300 shadow-xl shadow-zinc-200/50 dark:shadow-none active:scale-95"
      >
        Explore Home
      </button>
    </div>
  );
}

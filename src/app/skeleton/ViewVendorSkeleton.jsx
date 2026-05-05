"use client";

export default function ViewVendorSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F4F0] animate-pulse pb-24">

      {/* Hero */}
      <div className="h-60 bg-zinc-300 relative">
        <div className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/30" />
        <div className="absolute top-12 right-4 w-16 h-6 rounded-full bg-white/20" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
          <div className="w-[52px] h-[52px] rounded-2xl bg-white/25 shrink-0" />
          <div className="flex-1">
            <div className="h-6 bg-white/30 rounded-lg w-3/5 mb-2" />
            <div className="flex gap-1.5">
              <div className="h-4 w-14 bg-white/20 rounded-full" />
              <div className="h-4 w-16 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mx-4 bg-white rounded-b-2xl grid grid-cols-4 divide-x divide-zinc-100 border border-t-0 border-zinc-100">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5 py-3 px-1">
            <div className="w-4 h-4 rounded-full bg-zinc-100" />
            <div className="h-3 w-10 bg-zinc-100 rounded-full" />
            <div className="h-2 w-8 bg-zinc-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Nav */}
      <div className="px-4 mt-4 space-y-2.5">
        <div className="h-11 bg-white rounded-xl border border-zinc-100" />
        <div className="flex gap-2">
          {[80, 68, 88, 72, 64].map((w, i) => (
            <div
              key={i}
              className="h-8 bg-white rounded-full border border-zinc-100 shrink-0"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="px-4 mt-6 space-y-8">
        {[1,2].map(s => (
          <div key={s}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-[3px] h-5 bg-zinc-200 rounded-full" />
              <div className="h-4 w-28 bg-zinc-200 rounded-full" />
            </div>
            <div className="flex gap-3 -mx-4 px-4 overflow-hidden">
              {[1,2].map(i => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-white rounded-2xl overflow-hidden border border-zinc-100"
                  style={{ width: "72vw", maxWidth: "260px" }}
                >
                  <div className="h-[130px] bg-zinc-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-zinc-100 rounded-full w-4/5" />
                    <div className="h-3 bg-zinc-100 rounded-full w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
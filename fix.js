const fs = require('fs');
let content = fs.readFileSync('src/app/components/create-food/wizard/Step5Review.jsx', 'utf8');
content = content.replace(
`                                <div className="space-y-3">
                                        </div>
                                    )}
                                </div>`,
`                                <div className="space-y-3">
                                    {store.choice_groups.map(group => (
                                        <div key={group.tempId} className="p-3 bg-white/5 border border-white/5 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest">{group.name}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase">Pick {group.min_selections}-{group.max_selections}</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                {group.options.map(opt => (
                                                    <div key={opt.tempId} className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                                                        {opt.image ? (
                                                            <img src={opt.image} alt={opt.label} className="w-6 h-6 rounded-md object-cover border border-slate-700" />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-black text-orange-600">
                                                                {opt.price_modifier_naira > 0 ? "+" : "✓"}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col justify-center">
                                                            <span className="text-[8px] text-slate-300 font-bold uppercase leading-none">{opt.label}</span>
                                                            <span className={\`text-[7px] font-black mt-1 leading-none \${opt.price_modifier_naira > 0 ? 'text-orange-500' : 'text-slate-500'}\`}>
                                                                {opt.price_modifier_naira > 0 ? \`+ ₦\${opt.price_modifier_naira.toLocaleString()}\` : 'INCLUDED'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {store.choice_groups.length === 0 && (
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">No custom options configured</p>
                                        </div>
                                    )}
                                </div>`
);
fs.writeFileSync('src/app/components/create-food/wizard/Step5Review.jsx', content, 'utf8');
console.log("Done");

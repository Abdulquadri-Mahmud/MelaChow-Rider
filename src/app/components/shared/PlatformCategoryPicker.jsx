"use client";

/**
 * PlatformCategoryPicker
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared, store-agnostic category selector.
 * Used in: create-food, edit-food, create-combo, edit-combo.
 *
 * Props:
 *   value      — currently selected category _id (string | null)
 *   onChange   — (id: string, name: string) => void
 *   className  — optional extra wrapper class
 */

import { useEffect, useState } from "react";
import { getPlatformCategories } from "@/app/lib/menuApi";
import { motion, AnimatePresence } from "framer-motion";
import { FolderTree, Loader2, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Tree builder — includes ALL parents (even leaf-parents with no children)
// ─────────────────────────────────────────────────────────────────────────────
const buildCategoryTree = (data) => {
    // If data is already a tree (has 'children' property), map it to subCategories
    if (data.length > 0 && data[0].children) {
        return data.map(cat => ({
            ...cat,
            subCategories: cat.children || []
        }));
    }

    // Fallback for flat data
    const roots = [];
    const childrenMap = {};

    data.forEach((cat) => {
        const parentId = cat.parent?._id || cat.parent || null;
        if (!parentId) {
            roots.push({ ...cat, subCategories: [] });
        } else {
            const pid = typeof parentId === "object" ? parentId._id : parentId;
            if (!childrenMap[pid]) childrenMap[pid] = [];
            childrenMap[pid].push(cat);
        }
    });

    return roots.map((root) => ({
        ...root,
        subCategories: childrenMap[root._id] || [],
    }));
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PlatformCategoryPicker({ value, onChange, className = "" }) {
    const [loading, setLoading] = useState(false);
    const [tree, setTree] = useState([]);
    const [expandedParents, setExpandedParents] = useState({});

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const res = await getPlatformCategories();
                // backend returns { success: true, data: tree }
                const rawData = res.data || res.categories || [];
                const built = buildCategoryTree(rawData);
                setTree(built);

                // Auto-expand all groups that have children
                const expanded = {};
                built.forEach((root) => {
                    if (root.subCategories.length > 0) expanded[root._id] = true;
                });
                setExpandedParents(expanded);
            } catch (err) {
                toast.error("Failed to load categories");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const toggleExpanded = (parentId) =>
        setExpandedParents((prev) => ({ ...prev, [parentId]: !prev[parentId] }));

    const handleSelect = (cat) => {
        // Validation: Must be a leaf node
        if (cat.subCategories && cat.subCategories.length > 0) {
            toast.error("Please select a specific sub-category", {
                icon: "☝️",
                style: { fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }
            });
            return;
        }
        onChange(cat._id, cat.name);
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center py-12 text-zinc-400 ${className}`}>
                <Loader2 className="animate-spin mr-2" size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Loading taxonomy...</span>
            </div>
        );
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {/* ── List container ── */}
            <div className="space-y-2 max-h-96 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 bg-zinc-50/50 dark:bg-zinc-950/50 shadow-inner custom-scrollbar">
                {tree.map((parent) => {
                    const isParentActive = value === parent._id;
                    const isExpanded = expandedParents[parent._id];
                    const hasChildren = parent.subCategories.length > 0;

                    return (
                        <div key={parent._id} className="space-y-1">
                            {/* ── Parent row ── */}
                            <div className="flex items-center gap-1.5">
                                {/* Expand / collapse toggle */}
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleExpanded(parent._id)}
                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-orange-400 hover:text-orange-600 hover:bg-orange-500/10 transition-all"
                                    >
                                        {isExpanded
                                            ? <ChevronDown size={12} strokeWidth={3} />
                                            : <ChevronRight size={12} strokeWidth={3} />
                                        }
                                    </button>
                                ) : (
                                    <div className="flex-shrink-0 w-6" />
                                )}

                                {/* Parent card */}
                                <motion.button
                                    type="button"
                                    onClick={() => handleSelect(parent)}
                                    className={`flex-1 text-left px-4 py-3.5 rounded-xl transition-all border relative overflow-hidden ${
                                        isParentActive
                                            ? "border-orange-500/60 shadow-xl shadow-orange-500/20 scale-[1.01]"
                                            : "border-orange-900/30 hover:border-orange-500/40 hover:shadow-md hover:shadow-orange-500/10"
                                    } ${hasChildren ? 'cursor-default' : 'cursor-pointer'} bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800`}
                                    whileHover={!isParentActive && !hasChildren ? { scale: 1.005 } : {}}
                                    whileTap={!hasChildren ? { scale: 0.99 } : {}}
                                >
                                    {/* Ambient glow — strengthens on active */}
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/0 to-orange-600/20 transition-opacity duration-500 ${
                                            isParentActive ? "opacity-100" : "opacity-0"
                                        }`}
                                    />
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Brand accent bar */}
                                            <div
                                                className={`w-1 h-8 rounded-full flex-shrink-0 transition-all duration-300 ${
                                                    isParentActive
                                                        ? "bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                                                        : "bg-gradient-to-b from-orange-800/60 to-orange-600/30"
                                                }`}
                                            />
                                            <div>
                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-[0.2em] block leading-none mb-1.5 ${
                                                        isParentActive ? "text-orange-400" : "text-orange-700/80"
                                                    }`}
                                                >
                                                    {hasChildren ? 'Category Group' : 'Direct Category'}
                                                </span>
                                                <span
                                                    className={`text-[13px] uppercase tracking-tight ${
                                                        isParentActive ? "font-black text-white" : "font-bold text-zinc-200"
                                                    }`}
                                                >
                                                    {parent.name}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hasChildren ? (
                                                <span
                                                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/10`}
                                                >
                                                    {parent.subCategories.length} sub
                                                </span>
                                            ) : (
                                                <div
                                                    className={`transition-all duration-300 ${
                                                        isParentActive ? "scale-100 opacity-100" : "scale-50 opacity-0"
                                                    }`}
                                                >
                                                    <CheckCircle2 size={18} strokeWidth={3} className="text-orange-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.button>
                            </div>

                            {/* ── Children (sub-categories) ── */}
                            <AnimatePresence>
                                {hasChildren && isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="ml-8 space-y-1 pl-3 border-l-2 border-zinc-100 dark:border-zinc-800">
                                            {parent.subCategories.map((child) => {
                                                const isChildActive = value === child._id;
                                                // If backend ever returns 3 levels, we'd need recursion here
                                                // For now, children are assumed to be leaf nodes
                                                return (
                                                    <motion.button
                                                        key={child._id}
                                                        type="button"
                                                        onClick={() => handleSelect(child)}
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-all border ${
                                                            isChildActive
                                                                ? "border-orange-500 bg-white dark:bg-zinc-900 text-orange-600 shadow-lg shadow-orange-500/10 scale-[1.01]"
                                                                : "border-transparent hover:bg-white dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:shadow-sm hover:border-zinc-200 dark:hover:border-zinc-700"
                                                        }`}
                                                        whileHover={!isChildActive ? { scale: 1.005 } : {}}
                                                        whileTap={{ scale: 0.99 }}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span
                                                                    className={`text-[9px] font-bold uppercase block leading-none mb-1 ${
                                                                        isChildActive ? "text-orange-500/70" : "opacity-40"
                                                                    }`}
                                                                >
                                                                    {parent.name}
                                                                </span>
                                                                <span
                                                                    className={`text-[12px] uppercase tracking-tight ${
                                                                        isChildActive ? "font-black" : "font-bold"
                                                                    }`}
                                                                >
                                                                    {child.name}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className={`transition-transform duration-300 ${
                                                                    isChildActive ? "scale-100 opacity-100" : "scale-50 opacity-0"
                                                                }`}
                                                            >
                                                                <CheckCircle2 size={16} strokeWidth={3} className="text-orange-500" />
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Selected confirmation strip */}
            <AnimatePresence>
                {value && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-500/5 border border-orange-500/20 rounded-xl"
                    >
                        <CheckCircle2 size={12} className="text-orange-500 flex-shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                            Selected: {tree.find(p => p._id === value)?.name
                                || tree.flatMap(p => p.subCategories).find(c => c._id === value)?.name
                                || value}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

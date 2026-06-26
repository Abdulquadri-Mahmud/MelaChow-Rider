"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    ChevronDown,
    Calendar,
    Copy,
    X,
    AlertCircle,
    TrendingDown,
    Share2,
    ArrowUpRight,
    ArrowDownLeft,
    Bike,
    Loader2,
    CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRider } from "@/app/context/RiderContext";
import { getRiderWallet, getRiderWithdrawalHistory } from "@/app/lib/riderApi";
import toast from "react-hot-toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Classify a ledger transaction into one of two clear categories:
 *  - "earning"  = delivery credit (wallet top-up from completed order)
 *  - "payout"   = rider bank transfer (Paystack debit out to bank account)
 */
function classifyTx(tx) {
    if (tx.type === "credit") return "earning";
    // Debit with "Withdrawal" in description = Paystack bank transfer
    if (tx.type === "debit" && /withdrawal/i.test(tx.description || "")) return "payout";
    return "debit"; // generic debit (rare)
}

function txLabel(tx) {
    const kind = classifyTx(tx);
    if (kind === "earning") return "Delivery Earning";
    if (kind === "payout") return "Bank Transfer (Payout)";
    return tx.description || "Wallet Debit";
}

function txSubLabel(tx) {
    const kind = classifyTx(tx);
    if (kind === "earning") return "Order credit to wallet";
    if (kind === "payout") return "Paystack transfer to bank";
    return "Wallet debit";
}

function txIcon(tx) {
    const kind = classifyTx(tx);
    if (kind === "earning") return <ArrowDownLeft size={16} />;
    if (kind === "payout") return <ArrowUpRight size={16} />;
    return <ArrowUpRight size={16} />;
}

function txIconStyle(tx) {
    const kind = classifyTx(tx);
    if (kind === "earning") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20";
    if (kind === "payout") return "bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/20";
    return "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20";
}

function txAmountStyle(tx) {
    return classifyTx(tx) === "earning"
        ? "text-emerald-500"
        : "text-orange-500 dark:text-orange-400";
}

function txAmountPrefix(tx) {
    return classifyTx(tx) === "earning" ? "+" : "-";
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RiderTransactionsPage() {
    const router = useRouter();
    const { rider } = useRider();
    const [wallet, setWallet] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDateStr, setSelectedDateStr] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedTx, setSelectedTx] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    const [sharing, setSharing] = useState(false);
    const receiptRef = useRef(null);

    const riderId = rider?._id || rider?.id;

    const fetchData = async () => {
        if (!riderId) return;
        setLoading(true);
        try {
            const walletRes = await getRiderWallet(riderId);
            setWallet(walletRes?.data || walletRes);
            try {
                const historyRes = await getRiderWithdrawalHistory(riderId);
                setWithdrawals(historyRes?.data || historyRes || []);
            } catch (e) {
                console.error("Failed to fetch withdrawal history:", e);
            }
        } catch {
            toast.error("Failed to load transaction data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (riderId) fetchData(); }, [riderId]);

    const copyToClipboard = (text, field) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success("Copied!");
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getTxDetails = (tx) => {
        const referenceMatch = tx.description?.match(/Ref:\s*([A-Z0-9_]+)/i);
        const ref = referenceMatch ? referenceMatch[1] : null;
        const matchingWithdrawal = ref ? withdrawals.find(w => w.paystackReference === ref) : null;
        return { ref, withdrawal: matchingWithdrawal };
    };

    // ── Share receipt as image ───────────────────────────────────────────────
    const handleShare = async () => {
        if (!receiptRef.current || sharing) return;
        setSharing(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) { toast.error("Failed to capture receipt"); setSharing(false); return; }
                const file = new File([blob], "melachow-receipt.png", { type: "image/png" });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: "MelaChow Transaction Receipt",
                        text: `Transaction receipt from MelaChow Rider`,
                        files: [file],
                    });
                } else {
                    // Fallback: trigger image download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "melachow-receipt.png";
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Receipt saved!");
                }
                setSharing(false);
            }, "image/png");
        } catch (err) {
            console.error("Share error:", err);
            toast.error("Could not share receipt");
            setSharing(false);
        }
    };

    // ── Totals ───────────────────────────────────────────────────────────────
    const totals = useMemo(() => {
        let earnings = 0, payouts = 0;
        (wallet?.transactions || []).forEach(tx => {
            if (tx.type === "credit") earnings += tx.amount;
            else if (tx.type === "debit") payouts += tx.amount;
        });
        return { earnings, payouts };
    }, [wallet?.transactions]);

    // ── Date range (last 20 days) ─────────────────────────────────────────────
    const today = new Date();
    const dateRange = useMemo(() => {
        const list = [];
        for (let i = 0; i < 20; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            list.push({
                dateStr: d.toDateString(),
                dayName: d.toLocaleDateString(undefined, { weekday: "short" }),
                dayNum: d.getDate(),
                monthShort: d.toLocaleDateString(undefined, { month: "short" }),
                isToday: i === 0,
            });
        }
        return list;
    }, []);

    // ── Filtered transactions ─────────────────────────────────────────────────
    const filteredTransactions = useMemo(() => {
        if (!wallet?.transactions) return [];
        return [...wallet.transactions]
            .map(tx => {
                const { ref, withdrawal } = getTxDetails(tx);
                let computedStatus = "successful";
                if (withdrawal) computedStatus = withdrawal.status;
                return { ...tx, ref, withdrawal, computedStatus, kind: classifyTx(tx) };
            })
            .filter(tx => {
                if (selectedDateStr) {
                    const txDate = new Date(tx.date || tx.createdAt).toDateString();
                    if (txDate !== selectedDateStr) return false;
                }
                if (categoryFilter === "earning" && tx.kind !== "earning") return false;
                if (categoryFilter === "payout" && tx.kind !== "payout") return false;
                if (statusFilter === "successful" && tx.computedStatus !== "completed" && tx.computedStatus !== "successful") return false;
                if (statusFilter === "pending" && tx.computedStatus !== "pending" && tx.computedStatus !== "processing") return false;
                if (statusFilter === "failed" && tx.computedStatus !== "failed") return false;
                return true;
            })
            .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    }, [wallet?.transactions, selectedDateStr, categoryFilter, statusFilter, withdrawals]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-orange-500 mb-3" size={28} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Ledger...</p>
            </div>
        );
    }

    const txDate = selectedTx ? new Date(selectedTx.date || selectedTx.createdAt) : null;

    return (
        <div className="space-y-4 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Transactions</h1>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Rider Ledger</p>
                </div>
            </div>

            {/* Totals Summary Bar */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded p-3">
                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-0.5">Total Earnings</p>
                    <p className="text-base font-black text-gray-900 dark:text-white">₦{totals.earnings.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Delivery credits</p>
                </div>
                <div className="bg-orange-500/5 border border-orange-500/15 rounded p-3">
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-0.5">Total Payouts</p>
                    <p className="text-base font-black text-gray-900 dark:text-white">₦{totals.payouts.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Bank transfers</p>
                </div>
            </div>

            {/* Date Swiper */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                    <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                        Filter by date
                    </p>
                    {selectedDateStr && (
                        <button
                            onClick={() => setSelectedDateStr(null)}
                            className="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1"
                        >
                            <X size={9} /> Clear
                        </button>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-0.5 scroll-smooth">
                    {dateRange.map((d) => {
                        const isSelected = selectedDateStr === d.dateStr;
                        return (
                            <button
                                key={d.dateStr}
                                onClick={() => setSelectedDateStr(isSelected ? null : d.dateStr)}
                                className={`flex flex-col items-center justify-center min-w-[52px] h-[62px] rounded border-2 transition-all shrink-0 ${
                                    isSelected
                                        ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-500/25"
                                        : d.isToday
                                        ? "bg-orange-500/5 border-orange-500/30 text-orange-600 dark:text-orange-400"
                                        : "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-500"
                                }`}
                            >
                                <span className={`text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5 ${isSelected ? "text-white/80" : "opacity-70"}`}>
                                    {d.isToday ? "Today" : d.dayName}
                                </span>
                                <span className={`text-xl font-black leading-none ${isSelected ? "text-white" : ""}`}>
                                    {d.dayNum}
                                </span>
                                <span className={`text-[8px] font-bold uppercase tracking-wider leading-none mt-0.5 ${isSelected ? "text-white/70" : "opacity-50"}`}>
                                    {d.monthShort}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full h-10 px-3 pr-8 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded text-xs font-black uppercase tracking-wider outline-none appearance-none cursor-pointer text-gray-700 dark:text-white"
                    >
                        <option value="all">All Types</option>
                        <option value="earning">Earnings Only</option>
                        <option value="payout">Payouts Only</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-10 px-3 pr-8 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded text-xs font-black uppercase tracking-wider outline-none appearance-none cursor-pointer text-gray-700 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="successful">Successful</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Result count */}
            <div className="flex items-center justify-between px-0.5">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
                    {selectedDateStr ? ` · ${new Date(selectedDateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                </p>
            </div>

            {/* Transaction List */}
            <div className="space-y-2">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx, idx) => (
                        <motion.div
                            key={tx._id || idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => setSelectedTx(tx)}
                            className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded p-3 flex items-center justify-between hover:border-orange-500/20 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 border ${txIconStyle(tx)}`}>
                                    {txIcon(tx)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight truncate group-hover:text-orange-500 transition-colors">
                                        {txLabel(tx)}
                                    </p>
                                    <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-widest">
                                        {txSubLabel(tx)}
                                    </p>
                                    <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-widest flex items-center gap-1">
                                        <Calendar size={8} />
                                        {new Date(tx.date || tx.createdAt).toLocaleDateString(undefined, {
                                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                <p className={`text-sm font-black ${txAmountStyle(tx)}`}>
                                    {txAmountPrefix(tx)}₦{tx.amount.toLocaleString()}
                                </p>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                                    tx.computedStatus === "completed" || tx.computedStatus === "successful"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20"
                                        : tx.computedStatus === "failed"
                                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                }`}>
                                    {tx.computedStatus === "completed" || tx.computedStatus === "successful" ? "Done" : tx.computedStatus}
                                </span>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-dashed border-gray-200 dark:border-zinc-800 rounded p-8 flex flex-col items-center justify-center text-center">
                        <AlertCircle size={22} className="text-gray-300 dark:text-zinc-700 mb-2" />
                        <h3 className="text-gray-900 dark:text-white font-black text-sm mb-1">No Transactions</h3>
                        <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest max-w-[160px] leading-relaxed">
                            No records match the selected filters.
                        </p>
                    </div>
                )}
            </div>

            {/* Transaction Details Modal */}
            <AnimatePresence>
                {selectedTx && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTx(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.93, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 12 }}
                            className="relative w-full max-w-sm bg-white dark:bg-zinc-950 rounded border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[88vh] overflow-y-auto"
                        >
                            {/* ── Receipt Capture Target ── */}
                            <div ref={receiptRef} className="bg-white dark:bg-zinc-950 p-3 space-y-3">

                                {/* Header row */}
                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-2">
                                    <span className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider">
                                        {selectedTx.kind === "earning" ? "Earning Receipt" : "Payout Receipt"}
                                    </span>
                                    <button onClick={() => setSelectedTx(null)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white">
                                        <X size={15} />
                                    </button>
                                </div>

                                {/* MelaChow Logo + Amount */}
                                <div className="flex flex-col items-center text-center gap-2 pt-1">
                                    {/* Logo box */}
                                    <div className="flex items-center gap-1.5 bg-orange-600 px-3 py-1.5 rounded">
                                        <Bike size={14} className="text-white" />
                                        <span className="text-white font-black text-xs tracking-tight">
                                            Mela<span className="text-orange-200">Chow</span>
                                        </span>
                                    </div>

                                    {/* Tx type badge */}
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                                        selectedTx.kind === "earning"
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                            : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                                    }`}>
                                        {selectedTx.kind === "earning" ? "Delivery Earning" : "Bank Transfer (Payout)"}
                                    </span>

                                    {/* Amount */}
                                    <p className={`text-3xl font-black tracking-tight ${txAmountStyle(selectedTx)}`}>
                                        {txAmountPrefix(selectedTx)}₦{selectedTx.amount.toLocaleString()}
                                        <span className="text-sm font-bold">.00</span>
                                    </p>

                                    {/* Status badge */}
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                                        selectedTx.computedStatus === "completed" || selectedTx.computedStatus === "successful"
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                            : selectedTx.computedStatus === "failed"
                                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    }`}>
                                        {selectedTx.computedStatus === "completed" || selectedTx.computedStatus === "successful"
                                            ? "✓ Successful" : selectedTx.computedStatus}
                                    </span>
                                </div>

                                {/* Progress Timeline */}
                                <div className="px-3 py-2.5 border border-gray-100 dark:border-zinc-800 rounded bg-gray-50 dark:bg-zinc-900/50">
                                    <div className="flex items-start justify-between text-[8px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider relative">
                                        <div className="absolute left-[15%] right-[15%] top-[7px] h-[2px] bg-gray-200 dark:bg-zinc-800 z-0">
                                            <div className={`h-full transition-all duration-500 ${
                                                selectedTx.computedStatus === "failed"
                                                    ? "w-0"
                                                    : selectedTx.computedStatus === "pending" || selectedTx.computedStatus === "processing"
                                                    ? "w-[50%] bg-amber-500"
                                                    : "w-full bg-emerald-500"
                                            }`} />
                                        </div>
                                        {["Initiated", "Processing", "Settled"].map((step, i) => {
                                            const isDone = selectedTx.computedStatus === "completed" || selectedTx.computedStatus === "successful";
                                            const isPending = selectedTx.computedStatus === "pending" || selectedTx.computedStatus === "processing";
                                            const isFailed = selectedTx.computedStatus === "failed";
                                            let dotStyle = "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-600";
                                            if (i === 0) dotStyle = isFailed ? "bg-rose-500 text-white" : "bg-emerald-500 text-black";
                                            else if (i === 1) dotStyle = isFailed ? "bg-gray-200 dark:bg-zinc-700 text-gray-400" : isPending ? "bg-amber-500 text-black" : "bg-emerald-500 text-black";
                                            else if (i === 2) dotStyle = isDone ? "bg-emerald-500 text-black" : "bg-gray-200 dark:bg-zinc-700 text-gray-400";
                                            return (
                                                <div key={step} className="flex flex-col items-center z-10 space-y-1">
                                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black ${dotStyle}`}>
                                                        {i === 0 && isFailed ? "✕" : "✓"}
                                                    </div>
                                                    <span>{step}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded p-3 space-y-2.5 text-xs">

                                    {/* Earning-specific: rider info */}
                                    {selectedTx.kind === "earning" && (
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Credited To</p>
                                            <p className="font-extrabold text-gray-900 dark:text-white text-xs uppercase">
                                                {rider?.name || "Rider Wallet"}
                                            </p>
                                            <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold">MelaChow Wallet Balance</p>
                                        </div>
                                    )}

                                    {/* Payout-specific: bank info */}
                                    {selectedTx.kind === "payout" && selectedTx.withdrawal && (
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Sent To Bank</p>
                                            <p className="font-extrabold text-gray-900 dark:text-white text-xs uppercase">
                                                {selectedTx.withdrawal.bankName} — {selectedTx.withdrawal.accountName}
                                            </p>
                                            <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
                                                {selectedTx.withdrawal.accountNumber}
                                            </p>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-2 space-y-2">
                                        {/* Ref / ID */}
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Reference</p>
                                                <p className="font-black text-gray-900 dark:text-white text-[10px] select-all truncate max-w-[180px]">
                                                    {selectedTx.ref || selectedTx._id || "N/A"}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(selectedTx.ref || selectedTx._id, "ref")}
                                                className="shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-400"
                                            >
                                                <Copy size={11} />
                                            </button>
                                        </div>

                                        {/* Date */}
                                        <div className="flex justify-between">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Date & Time</span>
                                            <span className="font-black text-gray-900 dark:text-white text-[10px]">
                                                {txDate?.toLocaleString(undefined, {
                                                    month: "short", day: "numeric", year: "numeric",
                                                    hour: "2-digit", minute: "2-digit"
                                                })}
                                            </span>
                                        </div>

                                        {/* Channel */}
                                        <div className="flex justify-between">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Channel</span>
                                            <span className="font-black text-gray-900 dark:text-white text-[10px] uppercase">
                                                {selectedTx.kind === "earning" ? "MelaChow Platform" : "Paystack Transfer"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Error block */}
                                    {selectedTx.computedStatus === "failed" && selectedTx.withdrawal?.failureReason && (
                                        <div className="border-t border-gray-100 dark:border-zinc-800 pt-2 space-y-1">
                                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Failure Reason</p>
                                            <p className="font-bold text-rose-500 dark:text-rose-400 leading-relaxed bg-rose-50 dark:bg-rose-950/20 p-2 rounded text-[10px]">
                                                {selectedTx.withdrawal.failureReason}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* More Actions */}
                                {selectedTx.kind === "payout" && (
                                    <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded px-3 py-2">
                                        <button
                                            onClick={() => { setSelectedTx(null); router.push("/rider/wallet"); }}
                                            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider py-0.5 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all"
                                        >
                                            <TrendingDown size={13} />
                                            Initiate Another Payout
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ── Share button (outside receipt capture) ── */}
                            <div className="px-3 pb-3">
                                <button
                                    onClick={handleShare}
                                    disabled={sharing}
                                    className="w-full h-10 rounded bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 disabled:opacity-60"
                                >
                                    {sharing ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
                                    {sharing ? "Preparing..." : "Share Receipt"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

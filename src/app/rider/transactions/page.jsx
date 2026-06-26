"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Download,
    ChevronDown,
    Building2,
    Calendar,
    Copy,
    Check,
    X,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    Clock,
    Share2,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownLeft,
    HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRider } from "@/app/context/RiderContext";
import { getRiderWallet, getRiderWithdrawalHistory } from "@/app/lib/riderApi";
import toast from "react-hot-toast";

export default function RiderTransactionsPage() {
    const router = useRouter();
    const { rider } = useRider();
    const [wallet, setWallet] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDateStr, setSelectedDateStr] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState("all"); // all | credit | debit
    const [statusFilter, setStatusFilter] = useState("all"); // all | successful | pending | failed
    const [selectedTx, setSelectedTx] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

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
            } catch (historyErr) {
                console.error("Failed to fetch withdrawal history:", historyErr);
            }
        } catch (err) {
            toast.error("Failed to load transaction data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (riderId) {
            fetchData();
        }
    }, [riderId]);

    // Copy to clipboard helper
    const copyToClipboard = (text, field) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Helper to extract ref from ledger description or match with withdrawal history
    const getTxDetails = (tx) => {
        const referenceMatch = tx.description?.match(/Ref:\s*([A-Z0-9_]+)/i);
        const ref = referenceMatch ? referenceMatch[1] : null;
        const matchingWithdrawal = ref ? withdrawals.find(w => w.paystackReference === ref) : null;

        return {
            ref,
            withdrawal: matchingWithdrawal
        };
    };

    // Calculate dynamic "In" and "Out" for the currently visible month/ledger
    const totals = useMemo(() => {
        let incoming = 0;
        let outgoing = 0;
        if (wallet?.transactions) {
            wallet.transactions.forEach(tx => {
                if (tx.type === "credit") {
                    incoming += tx.amount;
                } else if (tx.type === "debit") {
                    outgoing += tx.amount;
                }
            });
        }
        return { incoming, outgoing };
    }, [wallet?.transactions]);

    // Generate date selector range (last 15 days dynamically)
    const dateRange = useMemo(() => {
        const list = [];
        for (let i = 0; i < 15; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            const dayName = d.toLocaleDateString(undefined, { weekday: "short" });
            const dayNum = d.getDate();
            list.push({ dateStr, dayName, dayNum });
        }
        return list;
    }, []);

    // Filter transactions based on category, status, and selected swipe date
    const filteredTransactions = useMemo(() => {
        if (!wallet?.transactions) return [];

        return [...wallet.transactions]
            .map(tx => {
                const { ref, withdrawal } = getTxDetails(tx);
                let status = "successful"; // Ledger credits/debits are completed transactions
                if (withdrawal) {
                    status = withdrawal.status; // pending, processing, completed, failed
                }
                return { ...tx, ref, withdrawal, computedStatus: status };
            })
            .filter(tx => {
                // 1. Date Filter
                if (selectedDateStr) {
                    const txDateStr = new Date(tx.date).toDateString();
                    if (txDateStr !== selectedDateStr) return false;
                }

                // 2. Category Filter
                if (categoryFilter !== "all" && tx.type !== categoryFilter) {
                    return false;
                }

                // 3. Status Filter
                if (statusFilter !== "all") {
                    if (statusFilter === "successful" && tx.computedStatus !== "completed" && tx.computedStatus !== "successful") return false;
                    if (statusFilter === "pending" && tx.computedStatus !== "pending" && tx.computedStatus !== "processing") return false;
                    if (statusFilter === "failed" && tx.computedStatus !== "failed") return false;
                }

                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [wallet?.transactions, selectedDateStr, categoryFilter, statusFilter, withdrawals]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Clock className="animate-spin text-orange-500 mb-3" size={28} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Ledger...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 rounded bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Transactions</h1>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Rider Ledger Accounts</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        toast.success("Downloading transaction report...");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/5 dark:bg-white/5 text-gray-700 dark:text-white text-[10px] font-black uppercase tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                >
                    <Download size={12} />
                    Download
                </button>
            </div>

            {/* Filter Dropdowns (as styled dropdowns in Image 2) */}
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full h-10 px-3 pr-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-black uppercase tracking-wider outline-none appearance-none cursor-pointer text-zinc-700 dark:text-white"
                    >
                        <option value="all">All Categories</option>
                        <option value="credit">Incoming Earnings</option>
                        <option value="debit">Outgoing Transfers</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>

                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-10 px-3 pr-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-black uppercase tracking-wider outline-none appearance-none cursor-pointer text-zinc-700 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="successful">Successful</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
            </div>

            {/* Date Swiper Filter (Scroll date to filter) */}
            <div className="space-y-1">
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">
                    Swipe date to filter
                </p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1.5 px-1 scroll-smooth">
                    {dateRange.map((dateObj) => {
                        const isSelected = selectedDateStr === dateObj.dateStr;
                        return (
                            <button
                                key={dateObj.dateStr}
                                onClick={() => setSelectedDateStr(isSelected ? null : dateObj.dateStr)}
                                className={`flex flex-col items-center justify-center min-w-[50px] h-12 rounded border transition-all shrink-0 ${
                                    isSelected
                                        ? "bg-orange-600 border-orange-600 text-white shadow-md"
                                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-orange-500"
                                }`}
                            >
                                <span className="text-[8px] font-bold uppercase tracking-wider leading-none">{dateObj.dayName}</span>
                                <span className="text-sm font-black mt-0.5 leading-none">{dateObj.dayNum}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Month Summary Block (Matching Image 2) */}
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-3 flex justify-between items-center">
                <div className="space-y-1">
                    <span className="text-xs font-black uppercase text-zinc-900 dark:text-white tracking-wider">
                        {selectedDateStr ? new Date(selectedDateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "All Time"}
                    </span>
                    <div className="flex gap-3 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                            In: <span className="text-emerald-500">₦{totals.incoming.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            Out: <span className="text-red-500">₦{totals.outgoing.toLocaleString()}</span>
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => toast.success("Opening transaction analysis...")}
                    className="px-2.5 py-1 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest rounded"
                >
                    Analysis
                </button>
            </div>

            {/* Transactions List */}
            <div className="space-y-2">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx, idx) => {
                        const isCredit = tx.type === "credit";
                        return (
                            <motion.div
                                key={tx._id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                onClick={() => setSelectedTx(tx)}
                                className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded p-3 flex items-center justify-between hover:border-orange-500/20 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Circle Icon Badge */}
                                    <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 border ${
                                        isCredit
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20"
                                            : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
                                    }`}>
                                        {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight truncate group-hover:text-orange-500 transition-colors">
                                            {tx.description || (isCredit ? "Order Earning" : "Wallet Payout")}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">
                                            {new Date(tx.date).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                    <p className={`text-sm font-black ${isCredit ? "text-emerald-500" : "text-zinc-800 dark:text-white"}`}>
                                        {isCredit ? "+" : "-"}₦{tx.amount.toLocaleString()}
                                    </p>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                                        tx.computedStatus === "completed" || tx.computedStatus === "successful"
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            : tx.computedStatus === "failed"
                                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    }`}>
                                        {tx.computedStatus === "completed" || tx.computedStatus === "successful" ? "Successful" : tx.computedStatus}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded p-8 flex flex-col items-center justify-center text-center">
                        <AlertCircle size={24} className="text-zinc-400 dark:text-zinc-600 mb-2" />
                        <h3 className="text-gray-900 dark:text-white font-black text-sm mb-1">No Transactions Found</h3>
                        <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest max-w-[180px] leading-relaxed">
                            No ledger history matches the selected filters.
                        </p>
                    </div>
                )}
            </div>

            {/* Centered Detail Modal (Themed Paystack Receipt from Image 1) */}
            <AnimatePresence>
                {selectedTx && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTx(null)}
                            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-zinc-950 rounded border border-zinc-800 shadow-2xl p-3 space-y-4 text-white overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header Close button */}
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Transaction Details</span>
                                <button onClick={() => setSelectedTx(null)} className="text-zinc-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Paystack Styled Badge & Header */}
                            <div className="flex flex-col items-center text-center space-y-2.5 pt-2">
                                <div className="w-10 h-10 rounded bg-white flex items-center justify-center p-1 border border-zinc-800">
                                    <img src="https://paystack.com/assets/img/login/paystack-logo.png" alt="Paystack" className="w-full object-contain" onError={(e) => { e.target.style.display = "none"; }} />
                                    <Building2 className="text-zinc-950 w-6 h-6" style={{ display: "none" }} />
                                </div>
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest max-w-xs truncate">
                                    {selectedTx.type === "credit" ? "Transfer from MelaChow Platform" : "Withdrawal Transfer"}
                                </h3>
                                <p className="text-3xl font-black tracking-tight text-white">
                                    ₦{selectedTx.amount.toLocaleString()}.00
                                </p>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                                    selectedTx.computedStatus === "completed" || selectedTx.computedStatus === "successful"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : selectedTx.computedStatus === "failed"
                                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                }`}>
                                    {selectedTx.computedStatus === "completed" || selectedTx.computedStatus === "successful" ? "Successful" : selectedTx.computedStatus}
                                </span>
                            </div>

                            {/* Processing Progress Line */}
                            <div className="px-4 py-2 border border-zinc-800 rounded bg-zinc-900/50 space-y-3">
                                <div className="flex items-center justify-between text-[8px] font-black text-zinc-400 uppercase tracking-wider relative">
                                    {/* Line connector */}
                                    <div className="absolute left-[15%] right-[15%] top-1 h-[2px] bg-zinc-800 z-0">
                                        <div className={`h-full bg-emerald-500 transition-all duration-500 ${
                                            selectedTx.computedStatus === "failed" ? "w-0 bg-rose-500" : selectedTx.computedStatus === "pending" ? "w-[50%]" : "w-full"
                                        }`} />
                                    </div>
                                    
                                    <div className="flex flex-col items-center z-10 space-y-1">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black ${
                                            selectedTx.computedStatus === "failed" ? "bg-rose-600 text-white" : "bg-emerald-500 text-black"
                                        }`}>
                                            {selectedTx.computedStatus === "failed" ? "✕" : "✓"}
                                        </div>
                                        <span>Initiated</span>
                                    </div>

                                    <div className="flex flex-col items-center z-10 space-y-1">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black ${
                                            selectedTx.computedStatus === "failed" ? "bg-zinc-800 text-zinc-500" : selectedTx.computedStatus === "pending" ? "bg-amber-500 text-black" : "bg-emerald-500 text-black"
                                        }`}>
                                            ✓
                                        </div>
                                        <span>Processed</span>
                                    </div>

                                    <div className="flex flex-col items-center z-10 space-y-1">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black ${
                                            selectedTx.computedStatus === "completed" || selectedTx.computedStatus === "successful" ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-500"
                                        }`}>
                                            ✓
                                        </div>
                                        <span>Settled</span>
                                    </div>
                                </div>
                                <p className="text-[8px] text-center text-zinc-500 font-bold uppercase tracking-widest">
                                    Disbursements settle instantly via instant transfers
                                </p>
                            </div>

                            {/* Details Block (Receipt layout from Image 1) */}
                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-3.5 text-xs">
                                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Transaction Details</h4>
                                
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Recipient Details</p>
                                    <p className="font-extrabold text-white text-xs leading-relaxed uppercase">
                                        {selectedTx.withdrawal
                                            ? `${selectedTx.withdrawal.accountName} | ${selectedTx.withdrawal.bankName} | ${selectedTx.withdrawal.accountNumber}`
                                            : rider?.name || "Rider Account"}
                                    </p>
                                </div>

                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Transaction No.</p>
                                        <p className="font-black text-white text-xs select-all break-all">{selectedTx.ref || selectedTx._id || "N/A"}</p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(selectedTx.ref || selectedTx._id, "ref")}
                                        className="shrink-0 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Payment Method</span>
                                    <span className="font-black text-white text-xs uppercase">Wallet</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Transaction Date</span>
                                    <span className="font-black text-white text-xs">
                                        {new Date(selectedTx.date).toLocaleString(undefined, {
                                            month: "short", day: "numeric", year: "numeric",
                                            hour: "2-digit", minute: "2-digit", second: "2-digit"
                                        })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Session ID</p>
                                        <p className="font-black text-white text-xs select-all break-all">{selectedTx._id || "N/A"}</p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(selectedTx._id, "session")}
                                        className="shrink-0 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>

                                {selectedTx.computedStatus === "failed" && selectedTx.withdrawal?.failureReason && (
                                    <div className="border-t border-zinc-800 pt-2 space-y-1">
                                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Error Detail</p>
                                        <p className="font-bold text-rose-400 leading-relaxed bg-rose-950/20 p-2.5 rounded">
                                            {selectedTx.withdrawal.failureReason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* More Actions */}
                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-2 text-xs">
                                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">More Actions</h4>
                                <button
                                    onClick={() => {
                                        setSelectedTx(null);
                                        router.push("/rider/wallet");
                                    }}
                                    className="flex items-center gap-2 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider py-1 hover:text-emerald-300 transition-all"
                                >
                                    <TrendingDown size={14} />
                                    Transfer Again
                                </button>
                            </div>

                            {/* Footer Buttons */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => toast.success("Issue report opened")}
                                    className="h-10 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    Report Issue
                                </button>
                                <button
                                    onClick={() => toast.success("Receipt shared successfully!")}
                                    className="h-10 rounded bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                                >
                                    <Share2 size={12} />
                                    Share Receipt
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

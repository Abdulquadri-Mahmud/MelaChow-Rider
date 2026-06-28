"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    Loader2,
    Building2,
    Send,
    CheckCircle2,
    X,
    Lock,
    DollarSign,
    Copy,
    Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRider } from "@/app/context/RiderContext";
import {
    getRiderWallet,
    getRiderBankAccount,
    getRiderWithdrawalHistory,
    initiateWithdrawal,
} from "@/app/lib/riderApi";
import toast from "react-hot-toast";

const RIDER_PAYOUT_THRESHOLD = 0;
// Updated to match backend sweep schedule (9:30 PM WAT daily)
const RIDER_PAYOUT_TIME_LABEL = "9:30 PM";

// Human-readable transaction type labels (prompt §7)
const TRANSACTION_LABELS = {
    rider_payout:    "Delivery earnings",
    delivery_spread: "Platform fee",
    withdrawal:      "Bank transfer",
    adjustment:      "Manual adjustment",
};

// ── Payout Sheet ──────────────────────────────────────────────────────────────
// ── Payout Details Modal ───────────────────────────────────────────────────
function PayoutScheduleInfo({ balance, bankAccount }) {
    const now = new Date();
    const payoutToday = new Date();
    // Rider sweep: 9:30 PM WAT (UTC+1) = 21:30 local Lagos time
    payoutToday.setHours(21, 30, 0, 0);
    const scheduledDay = now > payoutToday ? "Tomorrow" : "Today";

    return (
        <div className="bg-blue-500/5 border border-blue-500/10 rounded p-3 space-y-3">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Automatic Payout Scheduled</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">Time</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{scheduledDay} @ {RIDER_PAYOUT_TIME_LABEL}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">Amount</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white">
                        ₦{balance.toLocaleString()}
                    </p>
                </div>
            </div>

            {bankAccount ? (
                <div className="pt-2 border-t border-blue-500/10 flex items-center gap-2">
                    <Building2 size={12} className="text-blue-500" />
                    <p className="text-[10px] font-bold text-gray-500">
                        Settling to {bankAccount.bankName} (***{bankAccount.accountNumber.slice(-4)})
                    </p>
                </div>
            ) : (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                    Payout settings are temporarily locked for security.
                </p>
            )}
        </div>
    );
}

// ── Main Wallet Page ──────────────────────────────────────────────────────────
export default function RiderWalletPage() {
    const router = useRouter();
    const { rider } = useRider();
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bankAccount, setBankAccount] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [activeTab, setActiveTab] = useState("ledger"); // ledger | payouts
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

    const PAYSTACK_FEE = 0; // Platform absorbs the Paystack transfer fee for riders

    const riderId = rider?._id || rider?.id;

    const fetchWallet = async (isRefresh = false) => {
        if (!riderId) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await getRiderWallet(riderId);
            setWallet(res?.data || res);

            // Fetch withdrawals
            try {
                const historyRes = await getRiderWithdrawalHistory(riderId);
                setWithdrawals(historyRes?.data || historyRes || []);
            } catch (historyErr) {
                console.error("Failed to fetch rider withdrawal history:", historyErr);
                setWithdrawals([]);
            }
        } catch {
            toast.error("Failed to update wallet balance");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchPayoutDetails = async () => {
        if (!riderId) return;
        try {
            const res = await getRiderBankAccount(riderId);
            if (res?.data?.payoutEnabled) {
                setBankAccount(res.data);
            }
        } catch { }
    };

    useEffect(() => {
        if (riderId) { fetchWallet(); fetchPayoutDetails(); }
    }, [riderId]);

    const getTransactionTime = (transaction) => {
        const rawDate =
            transaction?.date ||
            transaction?.createdAt ||
            transaction?.updatedAt ||
            transaction?.paidAt ||
            transaction?.processedAt ||
            transaction?.completedAt ||
            transaction?._id?.$date;
        const timestamp = new Date(rawDate).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const transactions = useMemo(
        () => [...(wallet?.transactions || [])].sort((a, b) => getTransactionTime(b) - getTransactionTime(a)),
        [wallet?.transactions]
    );
    const balance = wallet?.balance || 0;

    const withdrawalStatusStyle = (status) => {
        switch (status) {
            case "completed": return { bg: "bg-green-500/10", text: "text-green-500", label: "Completed" };
            case "processing": return { bg: "bg-blue-500/10", text: "text-blue-500", label: "Processing" };
            case "pending": return { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Pending" };
            case "failed": return { bg: "bg-red-500/10", text: "text-red-500", label: "Failed" };
            case "reversed": return { bg: "bg-orange-500/10", text: "text-orange-500", label: "Reversed" };
            default: return { bg: "bg-gray-500/10", text: "text-gray-500", label: status };
        }
    };

    const handleWithdraw = async () => {
        if (!riderId) {
            toast.error("Rider session not found. Please log in again.");
            return;
        }
        const amount = Number(withdrawAmount);
        if (!amount || amount <= 0) {
            toast.error("Withdrawal amount must be greater than ₦0");
            return;
        }
        if (amount > balance) {
            toast.error("Amount exceeds your available balance");
            return;
        }
        setWithdrawing(true);
        try {
            const res = await initiateWithdrawal(riderId, amount);
            toast.success(res?.message || "Withdrawal initiated successfully!");
            setWithdrawModalOpen(false);
            await fetchWallet(true);
        } catch (err) {
            // Surface the exact backend message, falling back gracefully
            const errMsg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                (err?.response?.status === 404 ? "Withdrawal endpoint not found. Please contact support." : null) ||
                err?.message ||
                "Withdrawal failed. Please try again.";
            toast.error(errMsg);
            console.error("[Withdrawal error]", {
                status: err?.response?.status,
                data: err?.response?.data,
                url: err?.config?.url,
            });
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-orange-500 mb-3" size={28} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Wallet...</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-5 pb-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 rounded bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 dark:text-white">Rider Wallet</h1>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Earnings Management</p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchWallet(true)}
                        disabled={refreshing}
                        className={`w-8 h-8 rounded bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${refreshing ? "animate-spin opacity-50" : ""}`}
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>

                {/* Balance Card */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded p-3 overflow-hidden shadow-lg shadow-orange-600/20 relative">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest text-white/90 mb-2">
                                <RefreshCw size={9} className={refreshing ? "animate-spin" : ""} />
                                Available Balance
                            </div>
                            <div className="flex items-start">
                                <span className="text-base font-black text-white/70 mr-1 mt-1">₦</span>
                                <span className="text-4xl font-black text-white tracking-tight">
                                    {balance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <PayoutScheduleInfo
                    balance={balance}
                    bankAccount={bankAccount}
                />

                {/* ── Suspension Banner (prompt §7) ── */}
                {rider?.isSuspended && new Date(rider?.suspendedUntil) > new Date() && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-300
                                    dark:border-red-500/30 rounded-xl p-4 mb-3">
                        <p className="font-black text-red-800 dark:text-red-400 uppercase tracking-tight text-sm">
                            Account Suspended
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                            Your account is suspended until{" "}
                            {new Date(rider.suspendedUntil).toLocaleString("en-NG", {
                                dateStyle: "medium",
                                timeStyle: "short",
                            })}.
                        </p>
                        <p className="text-xs text-red-500 mt-1.5">
                            Reason: order terminated after food was already collected.
                            Contact support if you believe this is an error.
                        </p>
                    </div>
                )}

                {/* ── Strike Warning (renders if 1+ strikes, not yet suspended) ── */}
                {(rider?.terminationStrikes ?? 0) >= 1 && !rider?.isSuspended && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-400
                                    dark:border-amber-500/30 rounded-xl p-3 mb-3">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                            ⚠️ Strike Warning: {rider.terminationStrikes} of 2
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
                            A second termination after food pickup will suspend your
                            account for 48 hours.
                        </p>
                    </div>
                )}

                {/* ── Daily Payout Info Banner (always visible when not suspended) ── */}
                {!rider?.isSuspended && (
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200
                                    dark:border-blue-500/20 rounded-xl p-3 mb-4">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                            💸 Daily Payout
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                            Your earnings are sent to your bank every day at 9:30 PM.
                        </p>
                        <p className="text-xs text-blue-500 dark:text-blue-400/70 mt-1">
                            Deliveries completed after 9:30 PM pay out the following evening.
                            Bank credits may take 1 extra day on public holidays.
                        </p>
                    </div>
                )}

                {/* Manual Withdraw Button */}
                {bankAccount ? (
                    <button
                        onClick={() => {
                            setWithdrawAmount("");
                            setWithdrawModalOpen(true);
                        }}
                        disabled={balance <= 0}
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded flex items-center justify-center gap-2 text-sm transition-all active:scale-95 shadow-md shadow-orange-600/20"
                    >
                        <Send size={17} />
                        {balance <= 0
                            ? `No balance available to withdraw`
                            : "Withdraw Earnings"}
                    </button>
                ) : (
                    <div className="w-full bg-gray-900/80 dark:bg-white/10 text-white dark:text-white font-black py-3 rounded flex items-center justify-center gap-2 text-sm border border-white/10">
                        <Lock size={17} />
                        No Bank Account Linked
                    </div>
                )}

                {/* Transaction & Payout History */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded">
                            <button
                                onClick={() => setActiveTab("ledger")}
                                className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === "ledger"
                                        ? 'bg-white dark:bg-[#1A1D23] text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500'
                                }`}
                            >
                                Ledger
                            </button>
                            <button
                                onClick={() => setActiveTab("payouts")}
                                className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === "payouts"
                                        ? 'bg-white dark:bg-[#1A1D23] text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500'
                                }`}
                            >
                                Payouts
                            </button>
                        </div>
                        {activeTab === "ledger" ? (
                            <button
                                onClick={() => router.push("/rider/transactions")}
                                className="text-[10px] font-black text-orange-500 hover:text-orange-600 uppercase tracking-widest flex items-center gap-0.5"
                            >
                                View All Transactions <ChevronRight size={10} />
                            </button>
                        ) : (
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                {withdrawals.length} record(s)
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {activeTab === "ledger" ? (
                                transactions.length > 0 ? (
                                    transactions.map((tx, idx) => (
                                        <motion.div
                                            key={tx._id || idx}
                                            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded p-3 flex items-center justify-between hover:border-orange-500/20 transition-all group"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${tx.type === "credit"
                                                    ? "bg-green-500/10 text-green-600 dark:text-green-500"
                                                    : "bg-red-500/10 text-red-600 dark:text-red-500"
                                                    }`}>
                                                    {tx.type === "credit" ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">
                                                        {TRANSACTION_LABELS[tx.transactionType] ?? tx.description ?? (tx.type === "credit" ? "Order Earning" : "Wallet Withdrawal")}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-bold mt-0.5 flex items-center gap-1 uppercase tracking-widest">
                                                        <Calendar size={9} />
                                                        {new Date(tx.date || tx.createdAt).toLocaleDateString(undefined, {
                                                            month: "short", day: "numeric", year: "numeric",
                                                            hour: "2-digit", minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${tx.type === "credit" ? "text-green-500" : "text-red-500"}`}>
                                                    {tx.type === "credit" ? "+" : "-"}₦{tx.amount.toLocaleString()}
                                                </p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Done</p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="bg-white dark:bg-[#1A1D23] border border-dashed border-gray-200 dark:border-white/5 rounded p-8 flex flex-col items-center justify-center text-center"
                                    >
                                        <div className="w-12 h-12 rounded bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3 text-gray-400 dark:text-gray-600">
                                            <Clock size={24} />
                                        </div>
                                        <h3 className="text-gray-900 dark:text-white font-black text-sm mb-1">No Transactions Yet</h3>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest max-w-[180px] leading-relaxed">
                                            Complete a delivery to see earnings here.
                                        </p>
                                    </motion.div>
                                )
                            ) : (
                                withdrawals.length > 0 ? (
                                    withdrawals.map((withdraw, idx) => {
                                        const statusStyle = withdrawalStatusStyle(withdraw.status);
                                        return (
                                            <motion.div
                                                key={withdraw._id || idx}
                                                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                onClick={() => setSelectedWithdrawal(withdraw)}
                                                className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded p-3 flex items-center justify-between hover:border-orange-500/20 transition-all group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 bg-red-500/10 text-red-600 dark:text-red-500`}>
                                                        <ArrowDownCircle size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">
                                                            Payout to {withdraw.bankName}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 font-bold mt-1 flex items-center gap-1 uppercase tracking-widest">
                                                            <Calendar size={9} />
                                                            {new Date(withdraw.initiatedAt || withdraw.createdAt).toLocaleDateString(undefined, {
                                                                month: "short", day: "numeric", year: "numeric",
                                                                hour: "2-digit", minute: "2-digit",
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                                    <p className="text-sm font-black text-red-500">
                                                        -₦{withdraw.netAmount.toLocaleString()}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${statusStyle.bg} ${statusStyle.text} border-current`}>
                                                            {statusStyle.label}
                                                        </span>
                                                        {withdraw.status === "failed" && (
                                                            <AlertCircle size={10} className="text-red-500 animate-pulse shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="bg-white dark:bg-[#1A1D23] border border-dashed border-gray-200 dark:border-white/5 rounded p-8 flex flex-col items-center justify-center text-center"
                                    >
                                        <div className="w-12 h-12 rounded bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3 text-gray-400 dark:text-gray-600">
                                            <Clock size={24} />
                                        </div>
                                        <h3 className="text-gray-900 dark:text-white font-black text-sm mb-1">No Payouts Yet</h3>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest max-w-[180px] leading-relaxed">
                                            Payouts will show up here after being initiated.
                                        </p>
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Policy */}
                <div className="bg-orange-500/5 border border-orange-500/10 rounded p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-orange-500">
                        <AlertCircle size={14} />
                        <h4 className="font-black text-xs uppercase tracking-widest">Wallet Policy</h4>
                    </div>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        Earnings credit instantly after delivery. Payouts are made automatically every day at {RIDER_PAYOUT_TIME_LABEL} (no minimum balance required).
                    </p>
                </div>
            </div>

            {/* ── Withdrawal Modal ───────────────────────────────── */}
            <AnimatePresence>
                {withdrawModalOpen && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !withdrawing && setWithdrawModalOpen(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Withdraw Earnings</h3>
                                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Available: ₦{balance.toLocaleString()}</p>
                                    </div>
                                </div>
                                <button onClick={() => !withdrawing && setWithdrawModalOpen(false)} className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-3 space-y-4">
                                {/* Bank destination */}
                                {bankAccount && (
                                    <div className="flex items-center gap-2.5 p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                        <Building2 size={14} className="text-zinc-500 shrink-0" />
                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">
                                            {bankAccount.bankName} — {bankAccount.accountName} (***{bankAccount.accountNumber?.slice(-4)})
                                        </p>
                                    </div>
                                )}

                                {/* Amount Input */}
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Amount (₦)</label>
                                    <div className="relative mt-1.5">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-sm">₦</span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={withdrawAmount}
                                            onChange={e => setWithdrawAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            className="w-full h-12 pl-8 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-sm font-black text-zinc-900 dark:text-white outline-none focus:border-orange-500 dark:focus:border-orange-500 placeholder:text-zinc-300 placeholder:font-normal"
                                        />
                                    </div>
                                </div>

                                {/* Fee preview */}
                                {Number(withdrawAmount) > 0 && (
                                    <div className="p-3 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                                            <span>Withdrawal Amount</span>
                                            <span>₦{Number(withdrawAmount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                                            <span>Processing Fee</span>
                                            <span className="text-emerald-500 font-bold">₦0 (Absorbed by MelaChow)</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-black text-zinc-900 dark:text-white border-t border-blue-100 dark:border-blue-500/20 pt-1.5">
                                            <span>You'll Receive</span>
                                            <span className="text-orange-600">₦{Number(withdrawAmount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                {/* CTA */}
                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) < RIDER_PAYOUT_THRESHOLD || Number(withdrawAmount) > balance}
                                    className="w-full h-12 rounded bg-orange-600 hover:bg-orange-700 text-white font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-orange-600/20"
                                >
                                    {withdrawing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    {withdrawing ? "Processing..." : "Confirm Withdrawal"}
                                </button>
                                <p className="text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                    Funds transfer within 1–3 business days
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Centered Payout Details Modal */}
            <AnimatePresence>
                {selectedWithdrawal && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedWithdrawal(null)}
                            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded border border-gray-200 dark:border-zinc-800 shadow-2xl p-3 space-y-4 text-gray-900 dark:text-white overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header Close button */}
                            <div className="flex justify-between items-center border-b border-gray-200 dark:border-zinc-800 pb-2">
                                <span className="text-[10px] font-black uppercase text-gray-500 dark:text-zinc-400 tracking-wider">Payout Details</span>
                                <button onClick={() => setSelectedWithdrawal(null)} className="text-gray-400 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Paystack Styled Badge & Header */}
                            <div className="flex flex-col items-center text-center space-y-2.5 pt-2">
                                <div className="w-10 h-10 rounded bg-white flex items-center justify-center p-1 border border-gray-200 dark:border-zinc-800">
                                    <img src="https://paystack.com/assets/img/login/paystack-logo.png" alt="Paystack" className="w-full object-contain" onError={(e) => { e.target.style.display = "none"; }} />
                                    <Building2 className="text-gray-900 dark:text-zinc-950 w-6 h-6" style={{ display: "none" }} />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest max-w-xs truncate">
                                    Rider Payout Transfer
                                </h3>
                                <p className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                    ₦{selectedWithdrawal.netAmount.toLocaleString()}.00
                                </p>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                                    selectedWithdrawal.status === "completed" || selectedWithdrawal.status === "successful"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : selectedWithdrawal.status === "failed"
                                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                }`}>
                                    {selectedWithdrawal.status === "completed" || selectedWithdrawal.status === "successful" ? "Successful" : selectedWithdrawal.status}
                                </span>
                            </div>

                            {/* Processing Progress Line */}
                            <div className="px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded bg-gray-50 dark:bg-zinc-900/50 space-y-3">
                                <div className="flex items-center justify-between text-[8px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-wider relative">
                                    {/* Line connector */}
                                    <div className="absolute left-[15%] right-[15%] top-1 h-[2px] bg-gray-200 dark:bg-zinc-800 z-0">
                                        <div className={`h-full bg-emerald-500 transition-all duration-500 ${
                                            selectedWithdrawal.status === "failed" ? "w-0 bg-rose-500" : selectedWithdrawal.status === "pending" ? "w-[50%]" : "w-full"
                                        }`} />
                                    </div>
                                    
                                    <div className="flex flex-col items-center z-10 space-y-1">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black ${
                                            selectedWithdrawal.status === "failed" ? "bg-rose-600 text-white" : "bg-emerald-500 text-black"
                                        }`}>
                                            {selectedWithdrawal.status === "failed" ? "✕" : "✓"}
                                        </div>
                                        <span>Initiated</span>
                                    </div>

                                    <div className="flex flex-col items-center z-10 space-y-1">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black ${
                                            selectedWithdrawal.status === "failed" ? "bg-gray-300 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500" : selectedWithdrawal.status === "pending" ? "bg-amber-500 text-black" : "bg-emerald-500 text-black"
                                        }`}>
                                            ✓
                                        </div>
                                        <span>Processed</span>
                                    </div>

                                    <div className="flex flex-col items-center z-10 space-y-1">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black ${
                                            selectedWithdrawal.status === "completed" || selectedWithdrawal.status === "successful" ? "bg-emerald-500 text-black" : "bg-gray-300 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"
                                        }`}>
                                            ✓
                                        </div>
                                        <span>Settled</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Block */}
                            <div className="p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded space-y-3.5 text-xs">
                                <h4 className="text-[10px] font-black uppercase text-gray-500 dark:text-zinc-400 tracking-wider">Transfer Details</h4>
                                
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Recipient Bank Account</p>
                                    <p className="font-extrabold text-gray-900 dark:text-white text-xs leading-relaxed uppercase">
                                        {selectedWithdrawal.bankName} | {selectedWithdrawal.accountName} | {selectedWithdrawal.accountNumber}
                                    </p>
                                </div>

                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Payment Reference</p>
                                        <p className="font-black text-gray-900 dark:text-white text-xs select-all break-all">{selectedWithdrawal.paystackReference || "N/A"}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (selectedWithdrawal.paystackReference) {
                                                navigator.clipboard.writeText(selectedWithdrawal.paystackReference);
                                                toast.success("Copied reference!");
                                            }
                                        }}
                                        className="shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Payment Method</span>
                                    <span className="font-black text-gray-900 dark:text-white text-xs uppercase">Paystack Transfer</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Initiated Date</span>
                                    <span className="font-black text-gray-900 dark:text-white text-xs">
                                        {new Date(selectedWithdrawal.initiatedAt || selectedWithdrawal.createdAt).toLocaleString(undefined, {
                                            month: "short", day: "numeric", year: "numeric",
                                            hour: "2-digit", minute: "2-digit", second: "2-digit"
                                        })}
                                    </span>
                                </div>

                                {selectedWithdrawal.status === "failed" && selectedWithdrawal.failureReason && (
                                    <div className="border-t border-gray-200 dark:border-zinc-800 pt-2 space-y-1">
                                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Error Detail</p>
                                        <p className="font-bold text-rose-500 dark:text-rose-400 leading-relaxed bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded">
                                            {selectedWithdrawal.failureReason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Buttons */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => toast.success("Issue report opened")}
                                    className="h-10 rounded border border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    Report Issue
                                </button>
                                <button
                                    onClick={() => toast.success("Receipt shared successfully!")}
                                    className="h-10 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                                >
                                    <Share2 size={12} />
                                    Share Receipt
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </>
    );
}

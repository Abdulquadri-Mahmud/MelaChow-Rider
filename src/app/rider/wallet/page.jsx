"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    Clock,
    ChevronLeft,
    RefreshCw,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    Loader2,
    Building2,
    Send,
    CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRider } from "@/app/context/RiderContext";
import {
    getRiderWallet,
    getRiderBankAccount,
    getRiderWithdrawalHistory,
} from "@/app/lib/riderApi";
import toast from "react-hot-toast";

const RIDER_PAYOUT_THRESHOLD = 500;
const RIDER_PAYOUT_TIME_LABEL = "7:30 PM";

// ── Payout Sheet ──────────────────────────────────────────────────────────────
// ── Payout Details Modal ───────────────────────────────────────────────────
function PayoutScheduleInfo({ balance, bankAccount }) {
    const now = new Date();
    const payoutToday = new Date();
    payoutToday.setHours(19, 30, 0, 0);
    const scheduledDay = now > payoutToday ? "Tomorrow" : "Today";
    const isEligible = balance >= RIDER_PAYOUT_THRESHOLD;

    return (
        <div className="bg-blue-500/5 border border-blue-500/10 rounded p-4 space-y-3">
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
                        {isEligible ? `₦${balance.toLocaleString()}` : `Minimum ₦${RIDER_PAYOUT_THRESHOLD.toLocaleString()}`}
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

    const riderId = rider?._id || rider?.id;

    const fetchWallet = async (isRefresh = false) => {
        if (!riderId) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await getRiderWallet(riderId);
            setWallet(res?.data || res);
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
                            className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
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
                        className={`w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${refreshing ? "animate-spin opacity-50" : ""}`}
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>

                {/* Balance Card */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded p-5 overflow-hidden shadow-lg shadow-orange-600/20 relative">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white/90 mb-3">
                                <RefreshCw size={9} className={refreshing ? "animate-spin" : ""} />
                                Available Balance
                            </div>
                            <div className="flex items-start">
                                <span className="text-base font-black text-white/70 mr-1 mt-1">₦</span>
                                <span className="text-4xl font-black text-white tracking-tight">
                                    {balance.toLocaleString()}
                                </span>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="bg-white/10 backdrop-blur-md rounded p-3 border border-white/10">
                                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Lifetime</p>
                                    <p className="text-base font-black text-white">₦{Number(rider?.totalEarnings || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded p-3 border border-white/10">
                                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Deliveries</p>
                                    <p className="text-base font-black text-white">{rider?.totalDeliveries || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <PayoutScheduleInfo
                    balance={balance}
                    bankAccount={bankAccount}
                />

                <div className="w-full bg-gray-900/80 dark:bg-white/10 text-white dark:text-white font-black py-3 rounded flex items-center justify-center gap-2 text-sm border border-white/10">
                    <Building2 size={17} />
                    Payout Settings Locked
                </div>

                {/* Transaction History */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Clock className="text-orange-500" size={15} />
                            Transaction History
                        </h2>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{transactions.length} record(s)</span>
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {transactions.length > 0 ? (
                                transactions.map((tx, idx) => (
                                    <motion.div
                                        key={tx._id || idx}
                                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded p-3 flex items-center justify-between hover:border-orange-500/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tx.type === "credit"
                                                ? "bg-green-500/10 text-green-600 dark:text-green-500"
                                                : "bg-red-500/10 text-red-600 dark:text-red-500"
                                                }`}>
                                                {tx.type === "credit" ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">
                                                    {tx.description || (tx.type === "credit" ? "Order Earning" : "Wallet Withdrawal")}
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
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Policy */}
                <div className="bg-orange-500/5 border border-orange-500/10 rounded p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-orange-500">
                        <AlertCircle size={14} />
                        <h4 className="font-black text-xs uppercase tracking-widest">Wallet Policy</h4>
                    </div>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        Earnings credit instantly after delivery. Payouts are made automatically every day at {RIDER_PAYOUT_TIME_LABEL} (minimum balance of ₦{RIDER_PAYOUT_THRESHOLD.toLocaleString()}).
                    </p>
                </div>
            </div>

        </>
    );
}

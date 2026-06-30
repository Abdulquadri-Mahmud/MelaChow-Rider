"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bike, MapPin, Package, CheckCircle2, AlertCircle,
    Phone, Loader2, Navigation, XCircle,
    AlertTriangle, FileWarning, ChevronDown,
} from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import {
    getActiveRiderOrder,
    riderPickedUpOrder,
    requestDeliveryOTP,
    riderConfirmDelivery,
    terminateOrder,
    reportUndeliverable,
} from "@/app/lib/riderApi";
import toast from "react-hot-toast";
import socketService from "@/app/lib/socketService";
import { useSocket } from "@/app/context/SocketContext";
import { useDeliveryCountdown } from "@/app/hooks/useDeliveryCountdown";

// ── Termination reasons (prompt §4 — select input) ───────────────────────────
const TERMINATION_REASONS = [
    "Accident",
    "Flat tyre",
    "Vehicle breakdown",
    "Fuel ran out",
    "Cannot find address",
    "Customer unreachable",
    "Personal emergency",
    "Medical emergency",
    "Road blocked / flooding",
    "Police checkpoint delay",
    "Order damaged before pickup",
    "Wrong order given by restaurant",
    "Safety concern at delivery location",
    "Other",
];

// ── Undeliverable reasons (prompt §5 — dropdown/radio) ───────────────────────
const UNDELIVERABLE_REASONS = [
    "Food is spoiled",
    "Cannot reach previous rider",
    "Other",
];

// ── Termination Modal (prompt §4) ─────────────────────────────────────────────
function TerminateModal({ isOpen, onClose, onConfirm, isLoading, foodPickedUp, error }) {
    const [note, setNote] = useState("");

    useEffect(() => {
        if (isOpen) setNote("");
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* z-[2000] ensures modal renders above bottom nav (z-[1000]) */}
            <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-2">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 80 }}
                    className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600">
                                <XCircle size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                    Terminate Order
                                </h3>
                                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                    This order will be unassigned and broadcast to other riders.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Strike Warning — only when food already picked up */}
                    {foodPickedUp && (
                        <div className="mx-3 mt-3 p-2 rounded bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-start gap-2.5">
                            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">
                                    Strike Warning
                                </p>
                                <p className="text-xs font-bold text-red-600/90 dark:text-red-300/90 mt-1 leading-relaxed">
                                    You already picked up this food. Terminating now will log a strike against your account. 2 strikes = 48-hour suspension.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Reason Select */}
                    <div className="p-3 space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                                Note for the next rider (optional)
                            </label>
                            <div className="relative mt-1.5">
                                <select
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full px-3 py-2.5 pr-8 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-bold text-zinc-900 dark:text-white outline-none focus:border-red-500 dark:focus:border-red-500 appearance-none cursor-pointer"
                                >
                                    <option value="">— Select a reason (optional) —</option>
                                    {TERMINATION_REASONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Inline error display */}
                        {error && (
                            <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 h-11 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => onConfirm(note)}
                                disabled={isLoading}
                                className="flex-[2] h-11 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                {isLoading ? "Terminating..." : "Confirm Termination"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ── Undeliverable Modal (prompt §5) ──────────────────────────────────────────
function UndeliverableModal({ isOpen, onClose, onConfirm, isLoading, previousRider, error }) {
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (isOpen) setReason("");
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-2">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 80 }}
                    className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <FileWarning size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                    Unable to complete this order?
                                </h3>
                                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                    Vendor gets 15 min to remake
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="mx-3 mt-3 p-2 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                        <p className="text-[10px] font-bold text-blue-600/90 dark:text-blue-300/90 leading-relaxed">
                            Use this if the food is spoiled or you cannot reach the previous rider. The restaurant will be asked to remake the order.
                        </p>
                    </div>

                    {/* Previous Rider Context */}
                    {previousRider && (
                        <div className="mx-3 mt-2 p-2 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-1.5">
                            <p className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                                Previous Rider
                            </p>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                {previousRider.name} —{" "}
                                <a href={`tel:${previousRider.phone}`} className="underline font-black">
                                    {previousRider.phone}
                                </a>
                            </p>
                            {previousRider.foodPickedUp && (
                                <p className="text-[10px] font-bold text-amber-700/80 dark:text-amber-400/80">
                                    🍔 Food was collected by previous rider — contact them to retrieve or confirm it&apos;s spoiled.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Reason Dropdown */}
                    <div className="p-3 space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                                Reason
                            </label>
                            <div className="relative mt-1.5">
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-3 py-2.5 pr-8 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-bold text-zinc-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-amber-500 appearance-none cursor-pointer"
                                >
                                    <option value="">— Select a reason —</option>
                                    {UNDELIVERABLE_REASONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 h-11 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onConfirm(reason)}
                                disabled={isLoading || !reason}
                                className="flex-[2] h-11 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <FileWarning size={14} />}
                                {isLoading ? "Submitting..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OngoingDeliveryPage() {
    const router = useRouter();
    const { rider, refreshProfile } = useRider();
    const { isConnected: wsConnected } = useSocket();
    const [activeOrder, setActiveOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPickingUp, setIsPickingUp] = useState(false);
    const [isWaitingRemake, setIsWaitingRemake] = useState(false);
    const [remakeLabel, setRemakeLabel] = useState("");
    const [otpState, setOtpState] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("pending_delivery_otp");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return { ...parsed, confirming: false, sending: false };
                } catch {
                    // ignore
                }
            }
        }
        return { step: "idle", otp: "", sending: false, confirming: false, method: "", message: "" };
    });

    // ── Termination & Undeliverable state ─────────────────────────────────────
    const [terminateModalOpen, setTerminateModalOpen] = useState(false);
    const [undeliverableModalOpen, setUndeliverableModalOpen] = useState(false);
    const [terminateLoading, setTerminateLoading] = useState(false);
    const [undeliverableLoading, setUndeliverableLoading] = useState(false);
    const [terminateError, setTerminateError] = useState("");
    const [undeliverableError, setUndeliverableError] = useState("");

    // useRef guards — never useState — for mutation protection (prompt §1)
    const terminateGuardRef = useRef(false);
    const undeliverableGuardRef = useRef(false);

    const riderId = rider?._id || rider?.id;

    // ── Delivery countdown — MUST be before any early returns (Rules of Hooks) ─
    // acceptedAt may be null until activeOrder loads; the hook handles null gracefully.
    const acceptedAt = activeOrder?.riderAssignment?.assignedAt
        || activeOrder?.riderAssignment?.acceptedAt
        || activeOrder?.acceptedAt
        || null;
    const countdown = useDeliveryCountdown(acceptedAt);

    // Persist OTP state
    useEffect(() => {
        if (otpState.step === "awaiting_otp") {
            localStorage.setItem("pending_delivery_otp", JSON.stringify(otpState));
        } else if (otpState.step === "idle") {
            localStorage.removeItem("pending_delivery_otp");
        }
    }, [otpState]);

    const fetchActiveOrder = useCallback(async () => {
        if (!riderId) return;
        try {
            const data = await getActiveRiderOrder(riderId);
            const order = data?.data?.order || data?.order || (data?._id ? data : null);
            setActiveOrder(order);
            if (!order) {
                router.replace("/rider/dashboard");
            }
        } catch (error) {
            if (error?.response?.status === 404) {
                router.replace("/rider/dashboard");
            } else {
                console.error("Failed to fetch active order:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [riderId, router]);

    useEffect(() => {
        fetchActiveOrder();

        // Reconcile only when the realtime connection is unavailable.
        const interval = !wsConnected
            ? setInterval(fetchActiveOrder, 60000)
            : null;

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [fetchActiveOrder, wsConnected]);

    // Safety: clear stale OTP state if no active order
    useEffect(() => {
        if (!loading && !activeOrder && otpState.step !== "idle") {
            setOtpState({ step: "idle", otp: "", sending: false, confirming: false, method: "", message: "" });
        }
    }, [loading, activeOrder, otpState.step]);

    // ── Socket listeners (prompt §5, §8) ──────────────────────────────────────
    useEffect(() => {
        if (!activeOrder?._id) return;

        socketService.subscribeToRiderOrder?.(activeOrder._id);

        // OTP delivery
        socketService.onOrderStatusUpdate?.((data) => {
            if (data.orderId === activeOrder._id && data.deliveryOtp) {
                setActiveOrder((prev) => prev ? { ...prev, deliveryOtp: data.deliveryOtp } : prev);
            }

            // Watchdog fired — rider freed (prompt §8)
            if (
                data.orderId === activeOrder._id &&
                data.newStatus === "ready_for_pickup" &&
                data.changedBy?.includes?.("watchdog")
            ) {
                fetchActiveOrder();
                toast("Your delivery timed out. You have been unassigned.", { duration: 5000 });
                router.push("/rider/dashboard");
            }
        });

        // Vendor confirmed remake (prompt §5)
        const handleRemakeConfirmed = (data) => {
            if (data.orderId === activeOrder._id) {
                setIsWaitingRemake(false);
                setRemakeLabel("Restaurant is remaking your order. Pick up when ready.");
                fetchActiveOrder();
                toast.success("Restaurant confirmed remake. Pick up when ready.");
            }
        };

        // Dispute escalated (prompt §5)
        const handleDisputeEscalated = (data) => {
            if (data.orderId === activeOrder._id) {
                fetchActiveOrder();
                toast("Escalated to support. Stand by for instructions.", { duration: 6000 });
            }
        };

        socketService.socket?.on?.("vendor_remake_confirmed", handleRemakeConfirmed);
        socketService.socket?.on?.("order_disputed_escalated", handleDisputeEscalated);

        return () => {
            socketService.socket?.off?.("vendor_remake_confirmed", handleRemakeConfirmed);
            socketService.socket?.off?.("order_disputed_escalated", handleDisputeEscalated);
        };
    }, [activeOrder?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAction = async (action) => {
        if (!activeOrder || !riderId) return;
        const orderId = activeOrder._id;
        try {
            if (action === "pickup") {
                setIsPickingUp(true);
                try {
                    await riderPickedUpOrder(riderId, orderId);
                    toast.success("Order picked up! Head to the customer.");
                    await fetchActiveOrder();
                } finally {
                    setIsPickingUp(false);
                }
            } else if (action === "deliver") {
                setOtpState((prev) => ({ ...prev, sending: true }));
                try {
                    const res = await requestDeliveryOTP(riderId, orderId);
                    setOtpState({
                        step: "awaiting_otp",
                        otp: "",
                        sending: false,
                        confirming: false,
                        method: res.method || "",
                        message: res.message || "OTP sent to customer",
                    });
                    toast.success(res.message || "OTP requested!");
                } catch (err) {
                    setOtpState((prev) => ({ ...prev, sending: false }));
                    throw err;
                }
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || `Failed to ${action} order`);
        }
    };

    const handleConfirmOTP = async () => {
        if (!otpState.otp.trim() || !activeOrder || !riderId) return;
        setOtpState((prev) => ({ ...prev, confirming: true }));
        try {
            await riderConfirmDelivery(riderId, activeOrder._id, otpState.otp.trim());
            toast.success("Order delivered! Well done. 🎉");
            setOtpState({ step: "idle", otp: "", sending: false, confirming: false, method: "", message: "" });
            await refreshProfile();
            router.replace("/rider/dashboard");
        } catch (error) {
            setOtpState((prev) => ({ ...prev, confirming: false }));
            toast.error(error?.response?.data?.message || "Incorrect OTP. Ask the customer to check again.");
        }
    };

    // Terminate — useRef guard (prompt §4)
    const handleTerminate = async (note) => {
        if (terminateGuardRef.current) return;
        if (!activeOrder || !riderId) return;
        terminateGuardRef.current = true;
        setTerminateLoading(true);
        setTerminateError("");
        try {
            const res = await terminateOrder(riderId, activeOrder._id, note);
            terminateGuardRef.current = false;
            setTerminateLoading(false);
            setTerminateModalOpen(false);

            // Toast differs based on whether food was already picked up (prompt §4)
            const wasPickedUp = res?.foodPickedUp ?? isOutForDelivery;
            if (wasPickedUp) {
                toast(
                    "Order terminated. Strike logged. The next rider will contact you to hand over the food.",
                    { duration: 5000 }
                );
            } else {
                toast.success("Order terminated. A new rider will be assigned.", { duration: 4000 });
            }
            await refreshProfile();
            router.replace("/rider/dashboard");
        } catch (err) {
            terminateGuardRef.current = false;
            setTerminateLoading(false);
            const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to terminate order. Try again.";
            setTerminateError(msg);
        }
    };

    // Report Undeliverable — useRef guard (prompt §5)
    const handleReportUndeliverable = async (reason) => {
        if (undeliverableGuardRef.current) return;
        if (!activeOrder || !riderId) return;
        undeliverableGuardRef.current = true;
        setUndeliverableLoading(true);
        setUndeliverableError("");
        try {
            await reportUndeliverable(riderId, activeOrder._id, reason);
            undeliverableGuardRef.current = false;
            setUndeliverableLoading(false);
            setUndeliverableModalOpen(false);
            setIsWaitingRemake(true);
            setRemakeLabel("Waiting for restaurant to confirm remake…");
            toast.success("Reported. The restaurant has been contacted for a remake.", { duration: 5000 });
        } catch (err) {
            undeliverableGuardRef.current = false;
            setUndeliverableLoading(false);
            const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to report. Try again.";
            setUndeliverableError(msg);
        }
    };

    // ── Loading / empty states ─────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
                <Loader2 size={36} className="text-orange-600 animate-spin mb-4" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading Active Delivery...</p>
            </div>
        );
    }

    if (!activeOrder) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-6">
                    <Bike size={32} />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No Active Order</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium max-w-[240px] mb-6">
                    You do not have any ongoing deliveries at the moment.
                </p>
                <button
                    onClick={() => router.replace("/rider/dashboard")}
                    className="h-10 px-6 bg-orange-600 text-white rounded font-black text-xs transition-all active:scale-95 shadow-md shadow-orange-600/10 hover:bg-orange-700"
                >
                    RETURN TO DASHBOARD
                </button>
            </div>
        );
    }

    // ── Derived state ──────────────────────────────────────────────────────────
    const orderLifecycleStatus = activeOrder.orderStatus || activeOrder.status;
    const isHeadingToStore = ["assigned", "rider_assigned"].includes(orderLifecycleStatus);
    const isOutForDelivery = ["out_for_delivery", "picked_up"].includes(orderLifecycleStatus);
    const isDisputed = orderLifecycleStatus === "disputed_delivery";

    // Termination allowed any time (not disputed, not completed)
    const canTerminate = !isDisputed && !["delivered", "cancelled", "completed"].includes(orderLifecycleStatus);
    // Report Undeliverable: ONLY visible when hasPreviousRider is true (prompt §5)
    const canReportUndeliverable = !!activeOrder.hasPreviousRider && !isDisputed;

    // (countdown already derived at top of component)

    // Human-readable countdown label
    const countdownStr =
        countdown.remaining === null
            ? null
            : countdown.isExpired
            ? "⏰ Time expired — order being reassigned"
            : `⏱ ${String(countdown.minutes).padStart(2, "0")}:${String(countdown.seconds).padStart(2, "0")} remaining`;

    const countdownColorClass = countdown.isDanger
        ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        : countdown.isWarning
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400";

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-0 text-zinc-900 dark:text-zinc-100">
            <div className="max-w-md mx-auto mt-2 px-2 space-y-4">

                {/* ── Disputed Delivery Banner ──────────────────────────────── */}
                {isDisputed && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/40 flex items-start gap-3"
                    >
                        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                                Order Disputed
                            </p>
                            <p className="text-xs font-bold text-amber-600/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                                Vendor has been notified and has 15 minutes to respond. If no response, admin will intervene.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── Previous Rider Warning Banner (prompt §3) ──────────────
                     Prompt spec: amber border-l-4, phone as tappable tel: link */}
                {activeOrder.hasPreviousRider && activeOrder.previousRider && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-r"
                    >
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            ⚠️ Previously assigned to {activeOrder.previousRider.name}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                            📞{" "}
                            <a
                                href={`tel:${activeOrder.previousRider.phone}`}
                                className="underline font-medium ml-1"
                            >
                                {activeOrder.previousRider.phone}
                            </a>
                        </p>
                        {activeOrder.previousRider.foodPickedUp ? (
                            <p className="text-sm text-red-700 dark:text-red-400 font-semibold mt-2">
                                🍔 Food already collected — call the previous rider to receive the food before heading to the customer.
                            </p>
                        ) : (
                            <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                                ✅ Food is still at the restaurant — pick up as normal.
                            </p>
                        )}
                    </motion.div>
                )}

                {/* ── Remake waiting state label ────────────────────────────── */}
                {isWaitingRemake && remakeLabel && (
                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-xs font-bold text-blue-700 dark:text-blue-400">
                        {remakeLabel}
                    </div>
                )}

                {/* ── Main Card ─────────────────────────────────────────────── */}
                <div className="relative overflow-hidden bg-white dark:bg-[#1A1D23] rounded border border-zinc-100 dark:border-zinc-800 shadow-sm p-2">

                    {/* Header Badge */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">
                                <span className="w-1 h-1 bg-orange-500 rounded-full animate-ping" />
                                Active Delivery
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                {isHeadingToStore ? "Head to Store" : "Out for Delivery"}
                            </h2>
                        </div>
                        <div className="w-12 h-12 rounded bg-orange-600 text-white flex items-center justify-center">
                            <Bike size={24} className="animate-pulse" />
                        </div>
                    </div>

                    {/* Countdown Timer (prompt §8) — amber ≤15 min, red ≤5 min */}
                    {countdownStr !== null && !isDisputed && (
                        <div className={`text-xs font-semibold px-2 py-1 rounded mb-3 inline-block ${countdownColorClass}`}>
                            {countdownStr}
                        </div>
                    )}

                    {/* Stepper Route */}
                    <div className="relative space-y-5 mb-4">
                        <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-zinc-200 dark:bg-zinc-800 border-dashed border-l" />

                        {/* Pickup */}
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 z-10 border border-zinc-200 dark:border-zinc-700">
                                <Package size={16} className="text-orange-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Pickup Point</div>
                                <h4 className="text-gray-900 dark:text-white font-black text-sm truncate">
                                    {activeOrder.restaurantName || "Partner Merchant"}
                                </h4>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold truncate mt-0.5">
                                    {activeOrder.restaurantAddress || "Restaurant Location"}
                                </p>
                            </div>
                        </div>

                        {/* Drop-off */}
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded bg-orange-600 text-white flex items-center justify-center shrink-0 z-10">
                                <MapPin size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Delivery Point</div>
                                <h4 className="text-gray-900 dark:text-white font-black text-sm truncate">
                                    {activeOrder.userName || "Customer"}
                                </h4>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold line-clamp-2 mt-0.5">
                                    {activeOrder.deliveryFullAddress || "Customer Address"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    {activeOrder.items && activeOrder.items.length > 0 && (
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded p-2 mb-4 border border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                <Package size={14} className="text-orange-600" />
                                Order Details
                            </h3>
                            <div className="space-y-3">
                                {activeOrder.items.map((item, idx) => {
                                    const itemName = item.name || item.variant?.name || item.foodName || "Item";
                                    const quantity = Number(item.quantity) || 1;
                                    const options = item.selected_options || [];
                                    const portionLabel = item.portion_label || item.portion || "";
                                    let portionText = portionLabel || (quantity > 1 ? "portions" : "portion");
                                    let fullSentence = `Deliver ${quantity} ${portionText} of ${itemName}`;
                                    if (options.length > 0) {
                                        const optList = options.map((opt) => `${Number(opt.quantity) > 0 ? (Number(opt.quantity) * quantity) + "x " : ""}${opt.label || opt.name}`);
                                        fullSentence += `, with ${optList.length === 1 ? optList[0] : optList.length === 2 ? optList.join(" and ") : optList.slice(0, -1).join(", ") + ", and " + optList.slice(-1)}`;
                                    }
                                    fullSentence += ".";
                                    return (
                                        <div key={idx} className="flex gap-2.5">
                                            <div className="p-1 h-fit bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-500 shrink-0">
                                                <Package size={10} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">{fullSentence}</p>
                                                {item.note && (
                                                    <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 italic font-medium">Note: {item.note}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Customer Call bar */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded p-2 mb-4 flex items-center justify-between border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                                <Phone size={14} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Customer Contact</p>
                                <p className="text-zinc-900 dark:text-white font-black text-xs leading-none">
                                    {activeOrder.userName || "Customer"}
                                </p>
                            </div>
                        </div>
                        <a
                            href={`tel:${activeOrder.userPhone || ""}`}
                            className="h-8 px-3 rounded bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 font-black text-[10px] transition-all active:scale-95"
                        >
                            <Phone size={12} />
                            CALL
                        </a>
                    </div>

                    {/* OTP Confirmation notice */}
                    {activeOrder.deliveryOtp && (
                        <div className="bg-zinc-900 dark:bg-zinc-800 rounded p-2 mb-4 flex items-center gap-3 shadow-md">
                            <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">Confirmation Ready</p>
                                <p className="text-white font-bold text-[11px]">
                                    Delivery code has been sent to the customer&apos;s portal.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                const targetAddr = isHeadingToStore
                                    ? activeOrder.restaurantAddress || ""
                                    : activeOrder.deliveryFullAddress || "";
                                if (!targetAddr.trim()) { toast.error("Location address not found"); return; }
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetAddr)}`);
                            }}
                            className="h-12 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs flex items-center justify-center transition-all border border-zinc-200 dark:border-zinc-700 active:scale-95"
                        >
                            <Navigation size={16} className="mr-1.5 text-orange-600" />
                            OPEN MAPS
                        </button>

                        {isHeadingToStore ? (
                            <button
                                onClick={() => handleAction("pickup")}
                                disabled={isPickingUp}
                                className="h-12 rounded bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center font-black text-xs transition-all active:scale-95 disabled:opacity-60"
                            >
                                {isPickingUp ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <Package size={16} className="mr-1.5" />
                                        PICKED UP
                                    </>
                                )}
                            </button>
                        ) : !isDisputed ? (
                            <button
                                onClick={() => handleAction("deliver")}
                                disabled={otpState.sending || isWaitingRemake}
                                className="h-12 rounded bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center font-black text-xs transition-all active:scale-95 disabled:opacity-60"
                            >
                                {otpState.sending ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} className="mr-1.5" />
                                        DELIVERED
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="h-12 rounded bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-[9px] uppercase tracking-widest">
                                <AlertTriangle size={14} className="mr-1.5" />
                                DISPUTED
                            </div>
                        )}
                    </div>

                    {/* Terminate / Undeliverable row — visually secondary (prompt §4, §5) */}
                    {!isDisputed && (
                        <div className="flex gap-3 mt-3">
                            {canTerminate && (
                                <button
                                    onClick={() => { setTerminateError(""); setTerminateModalOpen(true); }}
                                    className="flex-1 h-10 rounded border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95"
                                >
                                    <XCircle size={13} />
                                    Terminate Order
                                </button>
                            )}
                            {/* Report Undeliverable: ONLY visible when hasPreviousRider (prompt §5) */}
                            {canReportUndeliverable && (
                                <button
                                    onClick={() => { setUndeliverableError(""); setUndeliverableModalOpen(true); }}
                                    className="flex-1 h-10 rounded border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all active:scale-95"
                                >
                                    <FileWarning size={13} />
                                    Report Undeliverable
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Full Screen OTP Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {otpState.step === "awaiting_otp" && (
                    <div className="fixed inset-0 z-50 flex bg-white dark:bg-[#1A1D23]">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="relative w-full min-h-screen bg-white dark:bg-[#1A1D23] p-6 overflow-y-auto flex items-center justify-center"
                        >
                            <div className="flex w-full max-w-sm flex-col items-center text-center space-y-6">
                                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center">
                                    <AlertCircle size={32} className="text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Verify Delivery</h3>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mt-1">
                                        {otpState.message || "Ask the customer for the code sent to them"}
                                    </p>
                                </div>

                                <div className="w-full space-y-4">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        autoFocus
                                        maxLength={6}
                                        value={otpState.otp}
                                        onChange={(e) => {
                                            if (e.target.value.length > 6) return;
                                            setOtpState((prev) => ({ ...prev, otp: e.target.value }));
                                        }}
                                        placeholder="0 0 0 0 0 0"
                                        className="w-full h-16 rounded bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-4 text-3xl font-black text-center tracking-[0.5em] text-zinc-900 dark:text-white outline-none focus:border-orange-500 caret-orange-500"
                                    />
                                    <button
                                        onClick={handleConfirmOTP}
                                        disabled={otpState.otp.trim().length !== 6 || otpState.confirming}
                                        className="w-full h-14 rounded bg-orange-600 text-white font-black text-sm disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                                    >
                                        {otpState.confirming ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> CONFIRM DELIVERY</>}
                                    </button>
                                    <button
                                        onClick={() => setOtpState((prev) => ({ ...prev, step: "idle" }))}
                                        className="text-xs font-black text-zinc-400 hover:text-zinc-500 uppercase tracking-widest py-2"
                                    >
                                        Cancel / Go Back
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Termination Modal ─────────────────────────────────────────── */}
            <TerminateModal
                isOpen={terminateModalOpen}
                onClose={() => { if (!terminateLoading) { setTerminateModalOpen(false); setTerminateError(""); } }}
                onConfirm={handleTerminate}
                isLoading={terminateLoading}
                foodPickedUp={isOutForDelivery}
                error={terminateError}
            />

            {/* ── Undeliverable Modal ──────────────────────────────────────── */}
            <UndeliverableModal
                isOpen={undeliverableModalOpen}
                onClose={() => { if (!undeliverableLoading) { setUndeliverableModalOpen(false); setUndeliverableError(""); } }}
                onConfirm={handleReportUndeliverable}
                isLoading={undeliverableLoading}
                previousRider={activeOrder?.previousRider}
                error={undeliverableError}
            />
        </div>
    );
}

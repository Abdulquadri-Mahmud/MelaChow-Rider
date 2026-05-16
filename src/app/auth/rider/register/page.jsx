"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle,
    Bike,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
    MapPin,
    Moon,
    Phone,
    Sun,
    User,
    CreditCard,
    Building2,
    CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/app/context/ThemeContext";
import { LocationService } from "@/app/lib/locationService";
import { riderRegister, getPublicBankList, resolvePublicAccount } from "@/app/lib/riderApi";

const initialForm = {
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    stateId: "",
    cityId: "",
    requestedState: "",
    requestedCity: "",
    vehicleType: "motorbike",
    payoutDetails: {
        bankName: "",
        bankCode: "",
        accountNumber: "",
        accountName: "",
    }
};

export default function RiderRegisterPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(initialForm);
    const [locations, setLocations] = useState([]);
    const [locationError, setLocationError] = useState("");
    const [loadingLocations, setLoadingLocations] = useState(true);
    
    const [banks, setBanks] = useState([]);
    const [isVerifyingBank, setIsVerifyingBank] = useState(false);
    const [bankVerified, setBankVerified] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [useCustomState, setUseCustomState] = useState(false);
    const [useCustomCity, setUseCustomCity] = useState(false);

    const TOTAL_STEPS = 4;

    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setLoadingLocations(true);
            const [locResult, bankResult] = await Promise.all([
                LocationService.fetchUserLocations(),
                getPublicBankList().catch(() => ({ banks: [] }))
            ]);
            
            if (!isMounted) return;

            if (locResult.success) {
                setLocations(locResult.locations || []);
            } else {
                setLocationError(locResult.error || "Unable to load locations.");
            }

            if (bankResult.banks) {
                setBanks(bankResult.banks);
            }
            setLoadingLocations(false);
        };
        loadInitialData();
        return () => { isMounted = false; };
    }, []);

    const cities = useMemo(() => {
        const selected = locations.find((location) => location.stateId === form.stateId);
        return selected?.cities || [];
    }, [form.stateId, locations]);

    const selectedCity = useMemo(
        () => cities.find((city) => city.cityId === form.cityId),
        [cities, form.cityId]
    );

    const updateField = (field, value) => {
        setError("");
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setForm(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setForm((current) => ({
                ...current,
                [field]: value,
                ...(field === "stateId" ? { cityId: "", requestedState: "", requestedCity: "" } : {}),
            }));
        }
    };

    const handleVerifyBank = async () => {
        const { accountNumber, bankCode } = form.payoutDetails;
        if (!accountNumber || accountNumber.length !== 10 || !bankCode) return;

        setIsVerifyingBank(true);
        try {
            const res = await resolvePublicAccount(accountNumber, bankCode);
            if (res.account_name) {
                updateField('payoutDetails.accountName', res.account_name);
                setBankVerified(true);
                toast.success("Account verified!");
            }
        } catch (err) {
            setBankVerified(false);
            toast.error("Could not verify account name");
        } finally {
            setIsVerifyingBank(false);
        }
    };

    // Auto-verify bank account
    useEffect(() => {
        if (form.payoutDetails.accountNumber.length === 10 && form.payoutDetails.bankCode && !bankVerified) {
            const timeoutId = setTimeout(handleVerifyBank, 800);
            return () => clearTimeout(timeoutId);
        }
    }, [form.payoutDetails.accountNumber, form.payoutDetails.bankCode]);

    const validateStep = (s) => {
        if (s === 1) {
            if (!form.name.trim()) return "Enter your full name.";
            if (!form.phone.trim()) return "Enter your phone number.";
        }
        if (s === 2) {
            if (useCustomState || useCustomCity) {
                if (!form.requestedState.trim() || !form.requestedCity.trim()) return "Enter your delivery state and city.";
            } else if (!form.stateId || !form.cityId) {
                return "Select your delivery state and city.";
            }
        }
        if (s === 3) {
            if (!form.payoutDetails.bankCode) return "Select your bank.";
            if (form.payoutDetails.accountNumber.length !== 10) return "Account number must be 10 digits.";
            if (!bankVerified) return "Please verify your bank account.";
        }
        if (s === 4) {
            if (form.password.length < 8) return "Password must be at least 8 characters.";
            if (form.password !== form.confirmPassword) return "Passwords do not match.";
        }
        return "";
    };

    const nextStep = () => {
        const err = validateStep(step);
        if (err) {
            setError(err);
            return;
        }
        setError("");
        setStep(s => s + 1);
    };

    const prevStep = () => {
        setError("");
        setStep(s => s - 1);
    };

    const handleSubmit = async (event) => {
        if (event) event.preventDefault();
        const validationError = validateStep(step);
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const locationPayload = useCustomState || useCustomCity
                ? {
                    state: form.requestedState.trim(),
                    city: form.requestedCity.trim(),
                    requestedState: form.requestedState.trim(),
                    requestedCity: form.requestedCity.trim(),
                    serviceZones: form.requestedCity.trim() ? [form.requestedCity.trim()] : [],
                }
                : {
                    stateId: form.stateId,
                    cityId: form.cityId,
                    serviceZones: selectedCity?.name ? [selectedCity.name] : [],
                };

            await riderRegister({
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                password: form.password,
                ...locationPayload,
                vehicleOwnership: "own",
                vehicleType: form.vehicleType,
                payoutDetails: {
                    ...form.payoutDetails,
                    payoutEnabled: true
                }
            });

            toast.success("Rider account registered successfully");
            setSuccess(true);
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Unable to submit your application.";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-slate-50 dark:bg-[#0F1115] flex items-center justify-center p-4 transition-colors">
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[28px] p-7 md:p-10 text-center shadow-2xl shadow-slate-200/80 dark:shadow-none"
                >
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 size={42} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                        Account registered successfully
                    </h1>
                    <p className="mt-4 text-sm md:text-base leading-7 text-slate-600 dark:text-slate-300">
                        Your rider account is under pending approval. Once the platform approves your account,
                        you will be notified and can proceed to log in to your dashboard to receive order offers.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/auth/rider/login"
                            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-black dark:bg-orange-600 dark:hover:bg-orange-700"
                        >
                            Go to login
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setForm(initialForm);
                                setStep(1);
                                setSuccess(false);
                            }}
                            className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-white/10 dark:text-slate-200"
                        >
                            Register another
                        </button>
                    </div>
                </motion.section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-[#0F1115] p-4 transition-colors flex flex-col items-center justify-center">
            {/* Nav Controls */}
            <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 backdrop-blur text-slate-500 transition hover:text-orange-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 backdrop-blur text-slate-500 transition hover:text-orange-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                    {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[400px]"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-600 text-white shadow-xl shadow-orange-600/20 mb-6">
                        <Bike size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Rider Application</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Step {step} of {TOTAL_STEPS}</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full mb-8 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                        className="h-full bg-orange-600"
                    />
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                        >
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-5 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                        >
                            {step === 1 && (
                                <>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Personal Information</h2>
                                    <Field label="Full Name" icon={<User size={18} />}>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => updateField("name", e.target.value)}
                                            placeholder="Your full name"
                                            className="rider-register-input"
                                        />
                                    </Field>
                                    <Field label="Phone Number" icon={<Phone size={18} />}>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => updateField("phone", e.target.value)}
                                            placeholder="0801 234 5678"
                                            className="rider-register-input"
                                        />
                                    </Field>
                                    <Field label="Email (Optional)" icon={<Mail size={18} />}>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => updateField("email", e.target.value)}
                                            placeholder="name@example.com"
                                            className="rider-register-input"
                                        />
                                    </Field>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Operations</h2>
                                    <Field label="State" icon={<MapPin size={18} />}>
                                        <select
                                            value={useCustomState ? "__custom__" : form.stateId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "__custom__") {
                                                    setUseCustomState(true);
                                                    setUseCustomCity(true);
                                                    return;
                                                }
                                                setUseCustomState(false);
                                                setUseCustomCity(false);
                                                updateField("stateId", val);
                                            }}
                                            className="rider-register-input appearance-none"
                                        >
                                            <option value="">{loadingLocations ? "Loading..." : "Select State"}</option>
                                            {locations.map(l => <option key={l.stateId} value={l.stateId}>{l.state}</option>)}
                                            <option value="__custom__">Other State</option>
                                        </select>
                                    </Field>

                                    {!useCustomState && (
                                        <Field label="City" icon={<MapPin size={18} />}>
                                            <select
                                                value={useCustomCity ? "__custom__" : form.cityId}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "__custom__") {
                                                        setUseCustomCity(true);
                                                        return;
                                                    }
                                                    setUseCustomCity(false);
                                                    updateField("cityId", val);
                                                }}
                                                className="rider-register-input appearance-none"
                                                disabled={!form.stateId}
                                            >
                                                <option value="">Select City</option>
                                                {cities.map(c => <option key={c.cityId} value={c.cityId}>{c.name}</option>)}
                                                <option value="__custom__">Other City</option>
                                            </select>
                                        </Field>
                                    )}

                                    {(useCustomState || useCustomCity) && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="Type State">
                                                <input
                                                    type="text"
                                                    value={form.requestedState}
                                                    onChange={(e) => updateField("requestedState", e.target.value)}
                                                    placeholder="Lagos"
                                                    className="rider-register-input"
                                                />
                                            </Field>
                                            <Field label="Type City">
                                                <input
                                                    type="text"
                                                    value={form.requestedCity}
                                                    onChange={(e) => updateField("requestedCity", e.target.value)}
                                                    placeholder="Ikeja"
                                                    className="rider-register-input"
                                                />
                                            </Field>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vehicle Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['motorbike', 'bicycle'].map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => updateField("vehicleType", v)}
                                                    className={`h-12 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${
                                                        form.vehicleType === v 
                                                        ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10" 
                                                        : "border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400"
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <div className="text-center space-y-1 mb-6">
                                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Payout Details</h2>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Tell us where to send your earnings</p>
                                    </div>
                                    <div className="space-y-4">
                                        <Field label="Select Bank" icon={<Building2 size={18} />}>
                                            <select
                                                value={form.payoutDetails.bankCode}
                                                disabled={bankVerified}
                                                onChange={(e) => {
                                                    const bank = banks.find(b => b.code === e.target.value);
                                                    updateField('payoutDetails.bankCode', e.target.value);
                                                    updateField('payoutDetails.bankName', bank?.name || "");
                                                    updateField('payoutDetails.accountName', "");
                                                    setBankVerified(false);
                                                }}
                                                className="rider-register-input appearance-none disabled:opacity-60"
                                            >
                                                <option value="">Choose Bank</option>
                                                {banks.map(b => <option key={b.id} value={b.code}>{b.name}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Account Number" icon={<CreditCard size={18} />}>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                value={form.payoutDetails.accountNumber}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    updateField('payoutDetails.accountNumber', val);
                                                    setBankVerified(false);
                                                }}
                                                placeholder="10 digit account number"
                                                className="rider-register-input"
                                            />
                                        </Field>
                                        
                                        <div className="relative">
                                            <Field label="Account Name" icon={<User size={18} />}>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={form.payoutDetails.accountName}
                                                    placeholder="Verification result..."
                                                    className="rider-register-input bg-slate-50 dark:bg-white/5 opacity-80"
                                                />
                                            </Field>
                                            <div className="absolute right-2 top-[30px]">
                                                {!bankVerified ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleVerifyBank}
                                                        disabled={isVerifyingBank || !form.payoutDetails.accountNumber || !form.payoutDetails.bankCode}
                                                        className="px-3 py-2 bg-slate-900 dark:bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                                                    >
                                                        {isVerifyingBank ? <Loader2 className="animate-spin" size={12} /> : "Verify"}
                                                    </button>
                                                ) : (
                                                    <div className="h-9 flex items-center pr-2">
                                                        <CheckCircle className="text-emerald-500" size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 4 && (
                                <>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Security</h2>
                                    <Field label="Password" icon={<Lock size={18} />}>
                                        <PasswordInput
                                            value={form.password}
                                            onChange={(val) => updateField("password", val)}
                                            show={showPassword}
                                            onToggle={() => setShowPassword(!showPassword)}
                                            placeholder="Min 8 characters"
                                        />
                                    </Field>
                                    <Field label="Confirm Password" icon={<Lock size={18} />}>
                                        <PasswordInput
                                            value={form.confirmPassword}
                                            onChange={(val) => updateField("confirmPassword", val)}
                                            show={showConfirmPassword}
                                            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                            placeholder="Repeat password"
                                        />
                                    </Field>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="h-14 px-6 rounded-2xl border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={step === TOTAL_STEPS ? handleSubmit : nextStep}
                            className="h-14 flex-1 rounded-2xl bg-slate-950 dark:bg-orange-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-orange-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : (
                                <>
                                    {step === TOTAL_STEPS ? "Submit Application" : "Continue"}
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Link */}
                <p className="text-center mt-8 text-xs font-black uppercase tracking-widest text-slate-400">
                    Already registered?{" "}
                    <Link href="/auth/rider/login" className="text-orange-600 hover:underline">
                        Log in
                    </Link>
                </p>
            </motion.div>
        </main>
    );
}

function Field({ label, icon, children }) {
    return (
        <label className="block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <span className="relative block group">
                {icon && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                        {icon}
                    </span>
                )}
                {children}
            </span>
        </label>
    );
}

function PasswordInput({ value, onChange, show, onToggle, placeholder }) {
    return (
        <>
            <input
                type={show ? "text" : "password"}
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="rider-register-input pr-12"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500"
            >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </>
    );
}

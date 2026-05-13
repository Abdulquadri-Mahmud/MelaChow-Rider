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
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/app/context/ThemeContext";
import { LocationService } from "@/app/lib/locationService";
import { riderRegister } from "@/app/lib/riderApi";

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
};

export default function RiderRegisterPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [form, setForm] = useState(initialForm);
    const [locations, setLocations] = useState([]);
    const [locationError, setLocationError] = useState("");
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [useCustomState, setUseCustomState] = useState(false);
    const [useCustomCity, setUseCustomCity] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadLocations = async () => {
            setLoadingLocations(true);
            setLocationError("");

            const result = await LocationService.fetchUserLocations();
            if (!isMounted) return;

            if (!result.success) {
                setLocationError(result.error || "Unable to load service locations.");
                setLocations([]);
            } else if (result.isLegacyMode) {
                setLocationError("Rider registration needs active city records. Please contact support.");
                setLocations([]);
            } else {
                setLocations(result.locations || []);
            }

            setLoadingLocations(false);
        };

        loadLocations();

        return () => {
            isMounted = false;
        };
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
        setForm((current) => ({
            ...current,
            [field]: value,
            ...(field === "stateId" ? { cityId: "", requestedState: "", requestedCity: "" } : {}),
        }));
    };

    const validateForm = () => {
        if (!form.name.trim()) return "Enter your full name.";
        if (!form.phone.trim()) return "Enter your phone number.";
        if (useCustomState || useCustomCity) {
            if (!form.requestedState.trim() || !form.requestedCity.trim()) {
                return "Enter your delivery state and city.";
            }
        } else if (!form.stateId || !form.cityId) {
            return "Select your delivery state and city.";
        }
        if (form.password.length < 8) return "Password must be at least 8 characters.";
        if (form.password !== form.confirmPassword) return "Passwords do not match.";
        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationError = validateForm();

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
        <main className="min-h-screen bg-slate-50 dark:bg-[#0F1115] p-4 transition-colors">
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center">
                <div className="absolute left-4 top-4 md:left-6 md:top-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-orange-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        aria-label="Go back"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <div className="absolute right-4 top-4 md:right-6 md:top-6">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-orange-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid w-full grid-cols-1 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 dark:border-white/10 dark:bg-white/5 dark:shadow-none lg:grid-cols-[0.85fr_1.15fr]"
                >
                    <aside className="bg-slate-950 p-8 text-white dark:bg-black/30">
                        <div className="flex h-full min-h-56 flex-col justify-between gap-10">
                            <div>
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-orange-600 text-white">
                                    <Bike size={32} strokeWidth={2.5} />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight">Rider registration</h1>
                                <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
                                    Apply with your correct city and delivery vehicle so the platform can review and approve your account.
                                </p>
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                Already approved?{" "}
                                <Link href="/auth/rider/login" className="text-orange-400 hover:text-orange-300">
                                    Log in
                                </Link>
                            </p>
                        </div>
                    </aside>

                    <section className="p-5 md:p-8">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                                >
                                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Full name" icon={<User size={18} />}>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(event) => updateField("name", event.target.value)}
                                        placeholder="Your full name"
                                        className="rider-register-input"
                                    />
                                </Field>

                                <Field label="Phone number" icon={<Phone size={18} />}>
                                    <input
                                        type="tel"
                                        required
                                        value={form.phone}
                                        onChange={(event) => updateField("phone", event.target.value)}
                                        placeholder="0801 234 5678"
                                        className="rider-register-input"
                                    />
                                </Field>
                            </div>

                            <Field label="Email address" icon={<Mail size={18} />}>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) => updateField("email", event.target.value)}
                                    placeholder="name@example.com"
                                    className="rider-register-input"
                                />
                            </Field>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Password" icon={<Lock size={18} />}>
                                    <PasswordInput
                                        value={form.password}
                                        onChange={(value) => updateField("password", value)}
                                        show={showPassword}
                                        onToggle={() => setShowPassword((current) => !current)}
                                        placeholder="Minimum 8 characters"
                                    />
                                </Field>

                                <Field label="Confirm password" icon={<Lock size={18} />}>
                                    <PasswordInput
                                        value={form.confirmPassword}
                                        onChange={(value) => updateField("confirmPassword", value)}
                                        show={showConfirmPassword}
                                        onToggle={() => setShowConfirmPassword((current) => !current)}
                                        placeholder="Repeat password"
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="State" icon={<MapPin size={18} />}>
                                    <select
                                        required
                                        disabled={loadingLocations || !!locationError}
                                        value={useCustomState ? "__custom__" : form.stateId}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            if (value === "__custom__") {
                                                setUseCustomState(true);
                                                setUseCustomCity(true);
                                                setForm((current) => ({
                                                    ...current,
                                                    stateId: "",
                                                    cityId: "",
                                                    requestedState: "",
                                                    requestedCity: "",
                                                }));
                                                return;
                                            }
                                            setUseCustomState(false);
                                            setUseCustomCity(false);
                                            updateField("stateId", value);
                                        }}
                                        className="rider-register-input appearance-none"
                                    >
                                        <option value="">{loadingLocations ? "Loading states..." : "Select state"}</option>
                                        {locations.map((location) => (
                                            <option key={location.stateId} value={location.stateId}>
                                                {location.state}
                                            </option>
                                        ))}
                                        <option value="__custom__">My state is not listed</option>
                                    </select>
                                </Field>

                                {!useCustomState && (
                                <Field label="City" icon={<MapPin size={18} />}>
                                    <select
                                        required
                                        disabled={!form.stateId || loadingLocations || !!locationError}
                                        value={useCustomCity ? "__custom__" : form.cityId}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            if (value === "__custom__") {
                                                setUseCustomCity(true);
                                                setForm((current) => ({ ...current, cityId: "", requestedCity: "" }));
                                                return;
                                            }
                                            setUseCustomCity(false);
                                            updateField("cityId", value);
                                        }}
                                        className="rider-register-input appearance-none"
                                    >
                                        <option value="">{form.stateId ? "Select city" : "Select state first"}</option>
                                        {cities.map((city) => (
                                            <option key={city.cityId} value={city.cityId}>
                                                {city.name}
                                            </option>
                                        ))}
                                        <option value="__custom__">My city is not listed</option>
                                    </select>
                                </Field>
                                )}
                            </div>

                            {(useCustomState || useCustomCity) && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Type state" icon={<MapPin size={18} />}>
                                    <input
                                        type="text"
                                        required
                                        value={form.requestedState}
                                        onChange={(event) => updateField("requestedState", event.target.value)}
                                        placeholder="e.g. Lagos"
                                        className="rider-register-input"
                                    />
                                </Field>
                                <Field label="Type city" icon={<MapPin size={18} />}>
                                    <input
                                        type="text"
                                        required
                                        value={form.requestedCity}
                                        onChange={(event) => updateField("requestedCity", event.target.value)}
                                        placeholder="e.g. Ikorodu"
                                        className="rider-register-input"
                                    />
                                </Field>
                            </div>
                            )}

                            {locationError && (
                                <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                                    {locationError}
                                </p>
                            )}

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Delivery vehicle
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: "motorbike", label: "Motorbike" },
                                        { value: "bicycle", label: "Bicycle" },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => updateField("vehicleType", option.value)}
                                            className={`flex h-14 items-center justify-center rounded-2xl border text-sm font-black transition ${
                                                form.vehicleType === option.value
                                                    ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
                                                    : "border-slate-200 text-slate-600 hover:border-orange-200 dark:border-white/10 dark:text-slate-300"
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || loadingLocations || !!locationError}
                                className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-700"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={19} strokeWidth={3} />
                                        Submitting
                                    </>
                                ) : (
                                    <>
                                        Submit application
                                        <ChevronRight size={18} strokeWidth={3} />
                                    </>
                                )}
                            </button>
                        </form>
                    </section>
                </motion.section>
            </div>
        </main>
    );
}

function Field({ label, icon, children }) {
    return (
        <label className="block space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <span className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {icon}
                </span>
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
                minLength={8}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="rider-register-input pr-14"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-600 dark:hover:text-orange-300"
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </>
    );
}

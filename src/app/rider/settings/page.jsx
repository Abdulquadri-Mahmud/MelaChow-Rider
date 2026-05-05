"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import {
    Bike, Phone, User, Shield, LogOut, ChevronRight,
    Bell, Moon, HelpCircle, MessageCircle, Star, Edit3, Mail,
    Camera, Lock
} from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import { useRider } from "@/app/context/RiderContext";
import PermanentInstallButton from "@/app/components/PermanentInstallButton";
import toast from "react-hot-toast";

const SettingRow = ({ icon: Icon, label, value, onClick, danger = false, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group ${danger
            ? "hover:bg-red-500/10"
            : "hover:bg-white/5"
            }`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-red-50 dark:bg-red-500/10" : "bg-black/5 dark:bg-white/5"
            }`}>
            <Icon size={18} className={danger ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"} />
        </div>
        <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${danger ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{label}</p>
            {value && <p className="text-xs text-gray-500 mt-0.5 truncate">{value}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
            {badge && (
                <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded-full">
                    {badge}
                </span>
            )}
            <ChevronRight size={16} className={danger ? "text-red-400/50" : "text-gray-600"} />
        </div>
    </button>
);

const CLOUDINARY_PRESET = "GrubDash";
const CLOUDINARY_HOST = "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload";

const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    try {
        const res = await fetch(CLOUDINARY_HOST, {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.secure_url;
    } catch (err) {
        toast.error("Image upload failed");
        return null;
    }
};

export default function RiderSettingsPage() {
    const { rider, logout, isOnline, toggleAvailability, updateProfile } = useRider();
    const { theme, toggleTheme } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({ name: "", phone: "", email: "", password: "" });

    const handleLogout = () => {
        toast.success("Logged out successfully");
        setTimeout(logout, 800);
    };

    const openEdit = () => {
        setEditData({
            name: rider?.name || "",
            phone: rider?.phone || "",
            email: rider?.email || "",
            password: ""
        });
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Filter out empty password
        const dataToUpdate = { ...editData };
        if (!dataToUpdate.password) delete dataToUpdate.password;

        const success = await updateProfile(dataToUpdate);
        if (success) setIsEditing(false);
        setIsSaving(false);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const toastId = toast.loading("Uploading avatar...");
        const url = await uploadToCloudinary(file);
        
        if (url) {
            const success = await updateProfile({ avatar: url });
            if (success) {
                toast.success("Avatar updated", { id: toastId });
            } else {
                toast.dismiss(toastId);
            }
        } else {
            toast.dismiss(toastId);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gradient-to-br dark:from-[#1E2128] dark:to-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-[28px] p-6 flex items-center gap-5"
            >
                <div className="relative group">
                    <div className="w-20 h-20 rounded-3xl bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-orange-500/30 shrink-0">
                        {rider?.avatar
                            ? <img src={rider.avatar} alt="" className="w-full h-full object-cover" />
                            : <Bike size={32} className="text-orange-600" />
                        }
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg border-2 border-white dark:border-[#1E2128] hover:scale-110 transition-all">
                        <Camera size={14} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white truncate">{rider?.name || "Rider"}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{rider?.phone || "—"}</p>
                    <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isOnline ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-500"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                        {isOnline ? "Available" : "Offline"}
                    </div>
                </div>
                <button
                    onClick={openEdit}
                    className="w-10 h-10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-400 transition-colors shrink-0"
                >
                    <Edit3 size={16} />
                </button>
            </motion.div>

            {/* Account Section */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-3xl overflow-hidden"
            >
                <div className="px-4 pt-4 pb-2">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Account & Security</p>
                </div>
                <SettingRow icon={User} label="Personal Info" value={rider?.name} onClick={openEdit} />
                <SettingRow icon={Phone} label="Phone Number" value={rider?.phone} onClick={openEdit} />
                <SettingRow icon={Mail} label="Email Address" value={rider?.email || "Not set"} onClick={openEdit} />
                <SettingRow icon={Lock} label="Security" value="Update Password" onClick={openEdit} />
                <SettingRow icon={Star} label="My Ratings" value={`${rider?.rating?.toFixed(1) || "New"} • ${rider?.ratingCount || 0} reviews`} onClick={() => toast("Ratings cannot be edited", { icon: "🔒" })} />
            </motion.div>

            {/* Preferences */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-3xl overflow-hidden"
            >
                <div className="px-4 pt-4 pb-2">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Preferences</p>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                        <Bell size={18} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Push Notifications</p>
                        <p className="text-xs text-gray-500 mt-0.5">New orders and alerts</p>
                    </div>
                    <button
                        onClick={() => setNotifications(!notifications)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? "bg-orange-600" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications ? "left-7" : "left-1"}`} />
                    </button>
                </div>
                {/* Theme Toggle */}
                <div className="flex items-center gap-4 p-4 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                        <Moon size={18} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Dark Mode</p>
                        <p className="text-xs text-gray-500 mt-0.5">Switch app theme</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? "bg-orange-600" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${theme === 'dark' ? "left-7" : "left-1"}`} />
                    </button>
                </div>
                <SettingRow icon={Bike} label="Availability" value={isOnline ? "Currently Online" : "Currently Offline"} onClick={toggleAvailability} badge={isOnline ? "LIVE" : undefined} />
            </motion.div>

            {/* Support */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-3xl overflow-hidden"
            >
                <div className="px-4 pt-4 pb-2">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Help & Support</p>
                </div>
                <SettingRow icon={HelpCircle} label="FAQs" onClick={() => toast("Coming soon", { icon: "🚧" })} />
                <SettingRow icon={MessageCircle} label="Chat with Support" onClick={() => toast("Coming soon", { icon: "🚧" })} />
                <SettingRow icon={Mail} label="Contact Us" value="support@melachow.ng" onClick={() => toast("Coming soon", { icon: "🚧" })} />
            </motion.div>

            {/* Logout */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-3xl overflow-hidden"
            >
                <SettingRow icon={LogOut} label="Log Out" danger onClick={handleLogout} />
            </motion.div>

            {/* Install App */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <PermanentInstallButton />
            </motion.div>

            {/* App version */}
            <p className="text-center text-[11px] text-gray-700 font-semibold pb-2">MelaChow Rider v1.0.1</p>

            {/* Edit Profile Modal */}
            <AnimatePresence>
            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="bg-white dark:bg-[#1A1D23] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-[#1A1D23] z-10 pb-2">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Profile Settings</h3>
                                <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                    <Edit3 size={18} className="rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6 pb-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-white/5 border-0 focus:ring-2 focus:ring-orange-500 rounded-2xl p-4 text-sm font-bold text-gray-900 dark:text-white transition-all shadow-inner"
                                                placeholder="Enter your name"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={editData.phone}
                                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-white/5 border-0 focus:ring-2 focus:ring-orange-500 rounded-2xl p-4 text-sm font-bold text-gray-900 dark:text-white transition-all shadow-inner"
                                                placeholder="Enter phone number"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Email Address</label>
                                            <input
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-white/5 border-0 focus:ring-2 focus:ring-orange-500 rounded-2xl p-4 text-sm font-bold text-gray-900 dark:text-white transition-all shadow-inner"
                                                placeholder="Enter email address"
                                            />
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                                            <label className="text-xs font-black text-orange-600 uppercase tracking-widest px-1 mb-2 block">Security Override</label>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">New Password</label>
                                                <input
                                                    type="password"
                                                    value={editData.password}
                                                    onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                                                    className="w-full bg-orange-50/50 dark:bg-orange-500/5 border border-orange-200/50 dark:border-orange-500/10 focus:ring-2 focus:ring-orange-500 rounded-2xl p-4 text-sm font-bold text-gray-900 dark:text-white transition-all shadow-inner"
                                                    placeholder="Enter new password (optional)"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-black p-4 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-[2] bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black p-4 rounded-2xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>
        </div>
    );
}


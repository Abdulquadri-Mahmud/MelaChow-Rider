"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Phone,
  Mail,
  Twitter,
  Instagram,
  ChevronRight,
  Search,
  ShoppingBag,
  User,
  CreditCard,
  Truck,
  HelpCircle,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

const ContactMethod = ({ icon: Icon, name, description, url, colorClass }) => (
  <motion.a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ y: -5, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
    whileTap={{ scale: 0.98 }}
    className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:border-orange-200 dark:hover:border-orange-500/30"
  >
    <div className={`p-4 rounded-2xl ${colorClass}`}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{name}</h3>
      <p className="text-[12px] font-medium text-zinc-400 dark:text-zinc-500">{description}</p>
    </div>
    <ChevronRight size={18} className="text-zinc-300 dark:text-zinc-600" />
  </motion.a>
);

const CategoryCard = ({ icon: Icon, title }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="flex flex-col items-center justify-center p-6 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-[32px] border border-transparent hover:border-orange-100 dark:hover:border-orange-500/30 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer group"
  >
    <div className="mb-3 p-3 rounded-2xl bg-white dark:bg-zinc-800 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
      <Icon size={24} />
    </div>
    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{title}</span>
  </motion.div>
);

export default function GetHelp() {
  const router = useRouter();

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative bg-orange-500 pt-8 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-white/10 blur-2xl opacity-50" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-12">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.back()}
              className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-all border border-white/10"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 backdrop-blur-md rounded-full shadow-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Support Online</span>
            </div>
            <div className="w-11 h-11" />
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10"
            >
              <HelpCircle className="text-white" size={32} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8 leading-tight"
            >
              How can we help <br /> you today?
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-md mx-auto"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium shadow-2xl shadow-orange-900/20 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 -mt-10 pb-20">
        {/* Quick Categories */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <CategoryCard icon={ShoppingBag} title="Orders" />
          <CategoryCard icon={Truck} title="Delivery" />
          <CategoryCard icon={CreditCard} title="Payments" />
          <CategoryCard icon={User} title="Account" />
        </section>

        {/* Contact Methods */}
        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-6">Contact Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <ContactMethod
            icon={MessageCircle}
            name="Chat with us"
            description="Instant support via WhatsApp"
            url="https://wa.me/2349134831368"
            colorClass="bg-green-50 dark:bg-green-500/10 text-green-500"
          />
          <ContactMethod
            icon={Phone}
            name="Give us a call"
            description="Talk to our support agent now"
            url="tel:2349134831368"
            colorClass="bg-blue-50 dark:bg-blue-500/10 text-blue-500"
          />
          <ContactMethod
            icon={Mail}
            name="Email Support"
            description="support@melachow.com"
            url="mailto:support@melachow.com"
            colorClass="bg-orange-50 dark:bg-orange-500/10 text-orange-500"
          />
          <ContactMethod
            icon={Mail}
            name="Email Help Desk"
            description="help@melachow.com"
            url="mailto:help@melachow.com"
            colorClass="bg-zinc-50 dark:bg-zinc-800 text-zinc-500"
          />
          <ContactMethod
            icon={Twitter}
            name="Twitter / X"
            description="Get updates on Twitter"
            url="https://twitter.com/yourhandle"
            colorClass="bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Support Tip */}
        <section className="bg-orange-50 dark:bg-orange-950/20 rounded-[32px] p-8 text-center border border-orange-100 dark:border-orange-900/30">
          <h3 className="text-lg font-bold text-orange-600 dark:text-orange-500 mb-2">Available 24/7</h3>
          <p className="text-sm font-medium text-orange-900/60 dark:text-orange-200/40 max-w-xs mx-auto">
            Our support team is always online to help you with any issues you might have.
          </p>
        </section>
      </main>
    </div>
  );
}

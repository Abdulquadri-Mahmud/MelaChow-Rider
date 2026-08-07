'use client';

import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function SwipeableToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        className: 'dark:bg-slate-800 dark:text-white',
        style: {
          borderRadius: '16px',
          fontFamily: 'var(--font-outfit)',
          fontSize: '14px',
          fontWeight: '600',
        },
      }}
    >
      {(t) => (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          onDragEnd={(event, info) => {
            if (Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 200) {
              toast.dismiss(t.id);
            }
          }}
          onClick={() => toast.dismiss(t.id)}
          className="cursor-grab active:cursor-grabbing select-none touch-pan-x"
        >
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  {icon}
                  {message}
                </div>
                {t.type !== 'loading' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.dismiss(t.id);
                    }}
                    className="ml-2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    aria-label="Close notification"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </ToastBar>
        </motion.div>
      )}
    </Toaster>
  );
}

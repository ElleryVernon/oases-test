"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Toast } from "./shared";

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-semibold text-white shadow-lg ${
              toast.tone === "error" ? "bg-red-500" : "bg-gray-900"
            }`}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.run();
                  onDismiss(toast.id);
                }}
                className="rounded-lg bg-white/15 px-2.5 py-1 text-[13px] font-bold text-white transition hover:bg-white/25"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

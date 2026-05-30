"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ConfirmRequest } from "./shared";

export function ConfirmDialog({
  request,
  onResolve,
}: {
  request: ConfirmRequest | null;
  onResolve: (value: boolean) => void;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!request) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onResolve(false);
      if (event.key === "Enter") onResolve(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request, onResolve]);

  const danger = request?.tone === "danger";

  return (
    <AnimatePresence>
      {request && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <motion.button
            aria-label="닫기"
            onClick={() => onResolve(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={request.title}
            className="elev-2 relative z-10 w-full max-w-[320px] rounded-3xl bg-white p-6 text-center"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 4 }}
            transition={{ type: "spring", damping: 28, stiffness: 360 }}
          >
            <h3 className="text-[17px] font-bold text-gray-900 break-keep">
              {request.title}
            </h3>
            <p className="mt-2 break-keep text-[14px] leading-6 text-gray-500">
              {request.message}
            </p>

            <div className="mt-5 flex gap-2">
              <button onClick={() => onResolve(false)} className="btn-secondary flex-1 py-3">
                취소
              </button>
              <button
                autoFocus
                onClick={() => onResolve(true)}
                className={`flex-1 rounded-xl py-3 text-[15px] font-semibold text-white transition active:scale-[0.98] ${
                  danger ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {request.confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

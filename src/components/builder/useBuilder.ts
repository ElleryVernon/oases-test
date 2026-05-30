"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { calcQuote } from "@/lib/quote";
import { calcKidFit } from "@/lib/kid-fit";
import type { Activity, Itinerary } from "@/types/itinerary";
import {
  apiRequest,
  sameOrder,
  toForm,
  type ActivityForm,
  type ConfirmRequest,
  type Toast,
} from "./shared";

export function useBuilder() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [editing, setEditing] = useState<ActivityForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  const historyRef = useRef<Itinerary[]>([]);
  const toastSeq = useRef(0);

  // Promise-based confirm so async handlers can `await` a design-system dialog
  // instead of the native window.confirm.
  const requestConfirm = useCallback(
    (options: Omit<ConfirmRequest, "resolve">) =>
      new Promise<boolean>((resolve) => setConfirmRequest({ ...options, resolve })),
    [],
  );

  const resolveConfirm = useCallback(
    (value: boolean) => {
      setConfirmRequest((current) => {
        current?.resolve(value);
        return null;
      });
    },
    [],
  );

  const quote = useMemo(() => (itinerary ? calcQuote(itinerary) : null), [itinerary]);
  const kidFit = useMemo(() => (itinerary ? calcKidFit(itinerary) : null), [itinerary]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, tone: Toast["tone"] = "info", action?: Toast["action"]) => {
      const id = ++toastSeq.current;
      setToasts((prev) => [...prev, { id, message, tone, action }]);
      setTimeout(() => dismissToast(id), action ? 4000 : 2600);
    },
    [dismissToast],
  );

  const rememberForUndo = useCallback((snapshot: Itinerary | null) => {
    if (!snapshot) return;
    const stack = historyRef.current;
    stack.push(structuredClone(snapshot));
    if (stack.length > 20) stack.shift();
    setCanUndo(true);
  }, []);

  const undo = useCallback(async () => {
    const snapshot = historyRef.current.pop();
    setCanUndo(historyRef.current.length > 0);
    if (!snapshot) return;
    setEditing(null);
    setSaving(true);
    try {
      const next = await apiRequest<Itinerary>("/api/itinerary", {
        method: "PUT",
        body: JSON.stringify(snapshot),
      });
      setItinerary(next);
      pushToast("되돌렸어요");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "되돌리지 못했어요", "error");
    } finally {
      setSaving(false);
    }
  }, [pushToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiRequest<Itinerary>("/api/itinerary");
        if (!cancelled) setItinerary(data);
      } catch (err) {
        if (!cancelled)
          pushToast(err instanceof Error ? err.message : "일정을 불러오지 못했어요", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  // Generic mutation with undo snapshot + optional success toast (with undo action).
  const mutate = useCallback(
    async (
      path: string,
      init: RequestInit,
      options: { snapshot?: boolean; success?: string; undoable?: boolean } = {},
    ) => {
      if (options.snapshot) rememberForUndo(itinerary);
      setSaving(true);
      try {
        const next = await apiRequest<Itinerary>(path, init);
        setItinerary(next);
        if (options.success) {
          pushToast(
            options.success,
            "info",
            options.undoable ? { label: "되돌리기", run: () => void undo() } : undefined,
          );
        }
        return next;
      } catch (err) {
        if (options.snapshot) {
          historyRef.current.pop();
          setCanUndo(historyRef.current.length > 0);
        }
        pushToast(err instanceof Error ? err.message : "요청을 처리하지 못했어요", "error");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [itinerary, pushToast, rememberForUndo, undo],
  );

  const saveActivity = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editing || !itinerary) return;

      const originalDay = itinerary.days.find((day) =>
        day.activities.some((activity) => activity.id === editing.id),
      )?.day;

      rememberForUndo(itinerary);
      setSaving(true);
      try {
        let next = await apiRequest<Itinerary>(`/api/activities/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: editing.title.trim() || "제목 없음",
            startTime: editing.startTime,
            endTime: editing.endTime,
            unitCostKRW: Number(editing.unitCostKRW) || 0,
            note: editing.note.trim(),
            category: editing.category,
            location: editing.location.trim() || "미정",
            perPerson: editing.perPerson,
          }),
        });

        if (originalDay !== undefined && editing.day !== originalDay) {
          next = await apiRequest<Itinerary>(`/api/activities/${editing.id}/move`, {
            method: "PATCH",
            body: JSON.stringify({ day: editing.day }),
          });
        }

        setItinerary(next);
        setEditing(null);
        pushToast("저장했어요");
      } catch (err) {
        historyRef.current.pop();
        setCanUndo(historyRef.current.length > 0);
        pushToast(err instanceof Error ? err.message : "저장하지 못했어요", "error");
      } finally {
        setSaving(false);
      }
    },
    [editing, itinerary, pushToast, rememberForUndo],
  );

  const addActivity = useCallback(
    (day: number) =>
      mutate(
        `/api/days/${day}/activities`,
        { method: "POST" },
        { snapshot: true, success: "새 일정을 추가했어요", undoable: true },
      ),
    [mutate],
  );

  const removeActivity = useCallback(
    async (activity: Activity) => {
      const ok = await requestConfirm({
        title: "이 일정을 삭제할까요?",
        message: `'${activity.title}'을(를) 일정에서 지워요. 되돌리기로 복구할 수 있어요.`,
        confirmLabel: "삭제",
        tone: "danger",
      });
      if (!ok) return;
      if (editing?.id === activity.id) setEditing(null);
      await mutate(
        `/api/activities/${activity.id}`,
        { method: "DELETE" },
        { snapshot: true, success: "삭제했어요", undoable: true },
      );
    },
    [editing, mutate, requestConfirm],
  );

  const reorderWithinDay = useCallback(
    async (dayNumber: number, orderedIds: string[]) => {
      if (!itinerary) return;
      const current =
        itinerary.days.find((day) => day.day === dayNumber)?.activities.map((a) => a.id) ??
        [];
      if (sameOrder(current, orderedIds)) return;

      rememberForUndo(itinerary);
      setSaving(true);
      try {
        const next = await apiRequest<Itinerary>(
          `/api/days/${dayNumber}/activities/reorder`,
          { method: "PATCH", body: JSON.stringify({ orderedIds }) },
        );
        setItinerary(next);
      } catch (err) {
        historyRef.current.pop();
        setCanUndo(historyRef.current.length > 0);
        // Force a fresh `days` identity so the optimistic local order snaps back.
        setItinerary((prev) =>
          prev
            ? { ...prev, days: prev.days.map((d) => ({ ...d, activities: [...d.activities] })) }
            : prev,
        );
        pushToast(err instanceof Error ? err.message : "순서를 바꾸지 못했어요", "error");
      } finally {
        setSaving(false);
      }
    },
    [itinerary, pushToast, rememberForUndo],
  );

  const resetItinerary = useCallback(async () => {
    const ok = await requestConfirm({
      title: "처음 일정으로 되돌릴까요?",
      message: "지금까지의 수정 내용이 모두 사라져요.",
      confirmLabel: "되돌리기",
      tone: "danger",
    });
    if (!ok) return;
    setEditing(null);
    historyRef.current = [];
    setCanUndo(false);
    await mutate("/api/itinerary/reset", { method: "POST" }, { success: "처음 일정으로 되돌렸어요" });
  }, [mutate, requestConfirm]);

  const openEdit = useCallback(
    (activity: Activity, day: number) => setEditing(toForm(activity, day)),
    [],
  );

  return {
    itinerary,
    quote,
    kidFit,
    loading,
    saving,
    editing,
    setEditing,
    toasts,
    dismissToast,
    canUndo,
    undo,
    saveActivity,
    addActivity,
    removeActivity,
    reorderWithinDay,
    resetItinerary,
    openEdit,
    confirmRequest,
    resolveConfirm,
  };
}

"use client";

import { useState } from "react";
import { useBuilder } from "@/components/builder/useBuilder";
import { TripHero } from "@/components/builder/TripHero";
import { DayTimeline } from "@/components/builder/DayTimeline";
import { KidFitCard } from "@/components/builder/KidFitCard";
import { SummaryBar } from "@/components/builder/SummaryBar";
import { SummarySheet } from "@/components/builder/SummarySheet";
import { EditSheet } from "@/components/builder/EditSheet";
import { Toaster } from "@/components/builder/Toaster";
import { ConfirmDialog } from "@/components/builder/ConfirmDialog";

export default function Home() {
  const builder = useBuilder();
  const [summaryOpen, setSummaryOpen] = useState(false);

  const {
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
  } = builder;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Toaster toasts={toasts} onDismiss={dismissToast} />

      <div className="mx-auto w-full max-w-[640px] px-4 pb-32 pt-6 sm:px-6">
        {loading || !itinerary ? (
          <LoadingState />
        ) : (
          <div className="flex flex-col gap-7">
            <TripHero
              itinerary={itinerary}
              canUndo={canUndo}
              onUndo={undo}
              onReset={resetItinerary}
              busy={saving}
            />

            {kidFit && <KidFitCard kidFit={kidFit} onOpen={() => setSummaryOpen(true)} />}

            <div className="flex flex-col gap-8">
              {itinerary.days.map((day, index) => (
                <DayTimeline
                  key={day.id}
                  day={day}
                  index={index}
                  disabled={saving}
                  onEdit={openEdit}
                  onAdd={addActivity}
                  onReorderCommit={reorderWithinDay}
                />
              ))}
            </div>

            <p className="pb-2 text-center text-[12px] text-gray-400">
              카드를 탭하면 편집할 수 있어요 · 손잡이를 끌어 순서를 바꿔보세요
            </p>
          </div>
        )}
      </div>

      {itinerary && quote && (
        <SummaryBar quote={quote} onOpen={() => setSummaryOpen(true)} />
      )}

      {itinerary && quote && kidFit && (
        <SummarySheet
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          itinerary={itinerary}
          quote={quote}
          kidFit={kidFit}
        />
      )}

      <EditSheet
        form={editing}
        days={itinerary?.days.map((day) => day.day) ?? []}
        saving={saving}
        onChange={setEditing}
        onSubmit={saveActivity}
        onDelete={() => {
          if (!editing || !itinerary) return;
          const activity = itinerary.days
            .flatMap((day) => day.activities)
            .find((item) => item.id === editing.id);
          if (activity) removeActivity(activity);
        }}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog request={confirmRequest} onResolve={resolveConfirm} />
    </main>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <div className="h-7 w-28 rounded-full skeleton" />
        <div className="h-8 w-64 max-w-full rounded-lg skeleton" />
        <div className="h-20 w-full rounded-2xl skeleton" />
      </div>
      {[0, 1].map((day) => (
        <div key={day} className="flex flex-col gap-3">
          <div className="h-6 w-32 rounded skeleton" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="ml-16 h-24 rounded-2xl skeleton" />
          ))}
        </div>
      ))}
    </div>
  );
}

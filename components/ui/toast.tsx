"use client";
import * as React from "react";

type ToastMsg = { id: number; text: string };
let counter = 1;

export function useToast() {
  const [items, setItems] = React.useState<ToastMsg[]>([]);
  const push = (text: string) =>
    setItems((xs) => [...xs, { id: counter++, text }]);
  const dismiss = (id: number) =>
    setItems((xs) => xs.filter((x) => x.id !== id));
  const element = (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="rounded bg-black px-3 py-2 text-white shadow"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm">{t.text}</span>
            <button onClick={() => dismiss(t.id)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
  return { push, element };
}

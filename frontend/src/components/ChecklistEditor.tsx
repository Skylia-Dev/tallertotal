"use client";

import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistRow {
  key: string;
  description: string;
  checked: boolean | null;
}

function TriStateButton({
  active, onClick, children, activeClass,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 w-7 rounded-md flex items-center justify-center border transition-colors",
        active ? activeClass : "border-border text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function ChecklistEditor({ items, onChange }: { items: ChecklistRow[]; onChange: (key: string, checked: boolean | null) => void }) {
  return (
    <div className="rounded-lg border divide-y">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-sm text-foreground">{item.description}</span>
          <div className="flex items-center gap-1 shrink-0">
            <TriStateButton
              active={item.checked === true}
              onClick={() => onChange(item.key, item.checked === true ? null : true)}
              activeClass="border-green-500 bg-green-50 text-green-600"
            >
              <Check className="h-3.5 w-3.5" />
            </TriStateButton>
            <TriStateButton
              active={item.checked === false}
              onClick={() => onChange(item.key, item.checked === false ? null : false)}
              activeClass="border-red-500 bg-red-50 text-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </TriStateButton>
            <TriStateButton
              active={item.checked === null}
              onClick={() => onChange(item.key, null)}
              activeClass="border-gray-400 bg-muted text-muted-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </TriStateButton>
          </div>
        </div>
      ))}
    </div>
  );
}

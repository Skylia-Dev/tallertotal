"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";

export function SortableWidget({
  id, editMode, onHide, children, className,
}: {
  id: string;
  editMode: boolean;
  onHide: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative ${className ?? ""}`}>
      {editMode && (
        <>
          <button
            {...attributes}
            {...listeners}
            type="button"
            title="Arrastrar para reordenar"
            className="absolute -top-2 -left-2 z-10 h-6 w-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onHide}
            title="Ocultar"
            className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-card border border-red-200 shadow-sm flex items-center justify-center text-red-400 hover:text-red-600 hover:border-red-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      {children}
    </div>
  );
}

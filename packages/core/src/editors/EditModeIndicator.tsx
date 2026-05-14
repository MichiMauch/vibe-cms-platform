"use client";

import { Pencil } from "lucide-react";
import { useEditMode } from "./EditModeProvider";

export function EditModeIndicator() {
  const { editMode, toggle } = useEditMode();

  if (!editMode) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition"
    >
      <Pencil className="w-4 h-4" />
      <span>Edit-Modus aktiv</span>
      <span className="text-blue-100 text-xs">Alt+E zum Beenden</span>
    </button>
  );
}

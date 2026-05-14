"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type EditModeContextValue = {
  editMode: boolean;
  toggle: () => void;
};

export const EditModeContext = createContext<EditModeContextValue | null>(null);

export function ForceEditMode({ children }: { children: React.ReactNode }) {
  return (
    <EditModeContext.Provider value={{ editMode: true, toggle: () => {} }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [editMode, setEditMode] = useState(false);

  const toggle = useCallback(() => setEditMode((v) => !v), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey && e.code === "KeyE") {
        e.preventDefault();
        setEditMode((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <EditModeContext.Provider value={{ editMode, toggle }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode(): EditModeContextValue {
  const ctx = useContext(EditModeContext);
  if (!ctx) {
    return { editMode: false, toggle: () => {} };
  }
  return ctx;
}

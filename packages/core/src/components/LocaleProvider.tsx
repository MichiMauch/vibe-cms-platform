"use client";

import { createContext, useContext } from "react";

const LocaleContext = createContext<string>("de");

export function LocaleProvider({ value, children }: { value: string; children: React.ReactNode }) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): string {
  return useContext(LocaleContext);
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useEditMode } from "./EditModeProvider";
import { useLocale } from "../components/LocaleProvider";
import { AIActionsOverlay } from "./AIActionsOverlay";

type Props = {
  path: string;
  value: string;
  as?: React.ElementType;
  className?: string;
};

const INLINE_TAGS = new Set(["span", "a", "code", "em", "strong", "small", "b", "i", "u"]);

export function EditableText({ path, value, as: Tag = "span", className }: Props) {
  const { editMode } = useEditMode();
  const locale = useLocale();
  const ref = useRef<HTMLElement | null>(null);
  const [savedValue, setSavedValue] = useState(value);

  useEffect(() => {
    setSavedValue(value);
  }, [value]);

  useEffect(() => {
    if (!editMode) return;
    if (ref.current && ref.current.innerText !== savedValue) {
      ref.current.innerText = savedValue;
    }
  }, [savedValue, editMode]);

  async function handleBlur() {
    const next = (ref.current?.innerText ?? "").replace(/\s+$/, "").replace(/^\s+/, "");
    if (next === savedValue) return;
    try {
      const res = await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, value: next, locale }),
      });
      if (res.ok) {
        setSavedValue(next);
      }
    } catch {
      // Silently fail; user can retry.
    }
  }

  const editClasses = editMode
    ? "outline outline-2 outline-blue-400/60 outline-offset-2 rounded-sm focus:outline-blue-500 focus:outline-2 cursor-text"
    : "";

  const isInline = typeof Tag === "string" && INLINE_TAGS.has(Tag);
  const Wrapper = isInline ? "span" : "div";
  const wrapperClass = editMode
    ? isInline
      ? "relative inline-block group align-baseline"
      : "relative group"
    : "contents";

  return (
    <Wrapper className={wrapperClass}>
      <Tag
        ref={ref}
        className={`${className ?? ""} ${editClasses}`.trim()}
        contentEditable={editMode}
        suppressContentEditableWarning
        onBlur={editMode ? handleBlur : undefined}
        spellCheck={editMode}
      >
        {savedValue}
      </Tag>
      {editMode && (
        <AIActionsOverlay
          path={path}
          value={savedValue}
          onUpdate={(next) => {
            setSavedValue(next);
            if (ref.current) ref.current.innerText = next;
          }}
        />
      )}
    </Wrapper>
  );
}

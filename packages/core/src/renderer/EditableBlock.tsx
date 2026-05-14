"use client";

import { useEditMode } from "../editors/EditModeProvider";

type Props = {
  id: string;
  type: string;
  index: number;
  children: React.ReactNode;
};

export function EditableBlock({ id, type, index, children }: Props) {
  const { editMode } = useEditMode();

  return (
    <div
      id={`block-${id}`}
      data-block-id={id}
      data-block-type={type}
      className={
        editMode
          ? "relative outline outline-2 outline-dashed outline-transparent hover:outline-blue-400/50 transition group/block scroll-mt-20"
          : "contents"
      }
    >
      {editMode && (
        <span className="pointer-events-none absolute top-2 left-2 z-20 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 group-hover/block:opacity-100 transition shadow-md">
          {type}
          <span className="text-blue-200/80 font-normal">#{index + 1}</span>
        </span>
      )}
      {children}
    </div>
  );
}

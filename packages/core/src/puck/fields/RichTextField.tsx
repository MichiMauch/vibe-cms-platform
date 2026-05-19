"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Link as LinkIcon, Unlink } from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

/** Puck custom field: a TipTap rich-text editor for HTML-string values.
 * Matches the subset used by the old EditableRichText (StarterKit + link). */
export function RichTextField({ value, onChange }: Props) {
  const [linkPromptOpen, setLinkPromptOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, linkOnPaste: true },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[3em] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",
      },
    },
    onBlur: ({ editor }) => {
      const html = normalize(editor.getHTML());
      onChange(html);
    },
  });

  if (!editor) return null;

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-md bg-slate-900 text-white shadow-lg ring-1 ring-black/10 px-1 py-1"
      >
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <span className="mx-0.5 h-5 w-px bg-white/20" aria-hidden />
        {editor.isActive("link") ? (
          <ToolbarButton
            label="Link entfernen"
            active
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Unlink className="w-4 h-4" />
          </ToolbarButton>
        ) : (
          <ToolbarButton
            label="Link"
            active={false}
            onClick={() => setLinkPromptOpen(true)}
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
      </BubbleMenu>
      {linkPromptOpen && (
        <LinkPromptDialog
          initialValue={(editor.getAttributes("link").href as string) ?? ""}
          onCancel={() => setLinkPromptOpen(false)}
          onSubmit={(url) => {
            setLinkPromptOpen(false);
            applyLink(editor, url);
          }}
        />
      )}
    </div>
  );
}

function applyLink(editor: Editor, url: string) {
  if (url.trim() === "") {
    editor.chain().focus().unsetLink().run();
    return;
  }
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized) && !normalized.startsWith("/") && !normalized.startsWith("#") && !normalized.startsWith("mailto:")) {
    normalized = `https://${normalized}`;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
}

function LinkPromptDialog({
  initialValue,
  onCancel,
  onSubmit,
}: {
  initialValue: string;
  onCancel: () => void;
  onSubmit: (url: string) => void;
}) {
  const [value, setValue] = useState(initialValue || "https://");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(value);
        }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-base font-semibold text-slate-900">Link einfügen</h2>
        <p className="mt-2 text-sm text-slate-600">Leer lassen + OK entfernt den Link.</p>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://…"
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            OK
          </button>
        </div>
      </form>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-7 w-7 items-center justify-center rounded transition ${
        active ? "bg-blue-500 text-white" : "text-slate-200 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function normalize(html: string): string {
  const trimmed = html.replace(/^(<p>\s*<\/p>)+/, "").replace(/(<p>\s*<\/p>)+$/, "").trim();
  if (trimmed === "<p></p>" || trimmed === "") return "";
  return trimmed;
}

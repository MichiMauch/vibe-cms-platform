"use client";

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
            onClick={() => promptLink(editor)}
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
      </BubbleMenu>
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

function promptLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("URL eingeben (leer = Link entfernen):", previous ?? "https://");
  if (url === null) return;
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

function normalize(html: string): string {
  const trimmed = html.replace(/^(<p>\s*<\/p>)+/, "").replace(/(<p>\s*<\/p>)+$/, "").trim();
  if (trimmed === "<p></p>" || trimmed === "") return "";
  return trimmed;
}

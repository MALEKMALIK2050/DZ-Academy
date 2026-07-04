import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { useEffect } from "react";

export default function RichEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Superscript,
      Subscript,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value]);

  if (!editor) return null;

  const btn = (action, label, active) => (
    <button
      type="button"
      onClick={action}
      style={{
        padding: "0.3rem 0.6rem", border: "1px solid #e2e8f0",
        borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem",
        background: active ? "#3182ce" : "white",
        color: active ? "white" : "#4a5568",
      }}>
      {label}
    </button>
  );

  return (
    <div style={{ border: "1px solid #cbd5e0", borderRadius: "8px", overflow: "hidden" }}>

      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", padding: "0.5rem", background: "#f7fafc", borderBottom: "1px solid #e2e8f0" }}>

        {/* Texte */}
        {btn(() => editor.chain().focus().toggleBold().run(), "G", editor.isActive("bold"))}
        {btn(() => editor.chain().focus().toggleItalic().run(), "I", editor.isActive("italic"))}
        {btn(() => editor.chain().focus().toggleUnderline().run(), "S", editor.isActive("underline"))}
        {btn(() => editor.chain().focus().toggleStrike().run(), "Str", editor.isActive("strike"))}
        {btn(() => editor.chain().focus().toggleSuperscript().run(), "X²", editor.isActive("superscript"))}
        {btn(() => editor.chain().focus().toggleSubscript().run(), "X₂", editor.isActive("subscript"))}

        <span style={{ width: "1px", background: "#e2e8f0", margin: "0 0.2rem" }} />

        {/* Symboles Maths */}
        {btn(() => editor.chain().focus().insertContent('√').run(), "√", false)}
        {btn(() => editor.chain().focus().insertContent('×').run(), "×", false)}
        {btn(() => editor.chain().focus().insertContent('÷').run(), "÷", false)}
        {btn(() => editor.chain().focus().insertContent('≠').run(), "≠", false)}
        {btn(() => editor.chain().focus().insertContent('≈').run(), "≈", false)}
        {btn(() => editor.chain().focus().insertContent('π').run(), "π", false)}


        <span style={{ width: "1px", background: "#e2e8f0", margin: "0 0.2rem" }} />

        {/* Titres */}
        {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), "H1", editor.isActive("heading", { level: 1 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2", editor.isActive("heading", { level: 2 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3", editor.isActive("heading", { level: 3 }))}

        <span style={{ width: "1px", background: "#e2e8f0", margin: "0 0.2rem" }} />

        {/* Listes */}
        {btn(() => editor.chain().focus().toggleBulletList().run(), "• Liste", editor.isActive("bulletList"))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), "1. Liste", editor.isActive("orderedList"))}

        <span style={{ width: "1px", background: "#e2e8f0", margin: "0 0.2rem" }} />

        {/* Alignement */}
        {btn(() => editor.chain().focus().setTextAlign("left").run(), "◀", editor.isActive({ textAlign: "left" }))}
        {btn(() => editor.chain().focus().setTextAlign("center").run(), "■", editor.isActive({ textAlign: "center" }))}
        {btn(() => editor.chain().focus().setTextAlign("right").run(), "▶", editor.isActive({ textAlign: "right" }))}
        {btn(() => editor.chain().focus().setTextAlign("justify").run(), "≡", editor.isActive({ textAlign: "justify" }))}

        <span style={{ width: "1px", background: "#e2e8f0", margin: "0 0.2rem" }} />

        {/* Bloc */}
        {btn(() => editor.chain().focus().toggleBlockquote().run(), "❝ Citation", editor.isActive("blockquote"))}
        {btn(() => editor.chain().focus().toggleCodeBlock().run(), "{ } Code", editor.isActive("codeBlock"))}
        {btn(() => editor.chain().focus().setHorizontalRule().run(), "─ Ligne", false)}

        <span style={{ width: "1px", background: "#e2e8f0", margin: "0 0.2rem" }} />

        {/* Lien */}
        {btn(() => {
          const url = window.prompt("URL du lien:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }, "🔗 Lien", editor.isActive("link"))}

        {editor.isActive("link") && btn(
          () => editor.chain().focus().unsetLink().run(),
          "✖ Lien", false
        )}

        <span style={{ width: "1px", background: "#e2e8f0", margin: "0 0.2rem" }} />

        {/* Annuler/Refaire */}
        {btn(() => editor.chain().focus().undo().run(), "↩ Annuler", false)}
        {btn(() => editor.chain().focus().redo().run(), "↪ Refaire", false)}
      </div>

      {/* Zone édition */}
      <EditorContent
        editor={editor}
        style={{ minHeight: "200px", padding: "1rem", fontSize: "0.95rem", lineHeight: "1.6", outline: "none" }}
      />

      {/* CSS éditeur */}
      <style>{`
        .ProseMirror { outline: none; min-height: 200px; }
        .ProseMirror p { margin: 0.5rem 0; }
        .ProseMirror h1 { font-size: 1.8rem; font-weight: bold; margin: 1rem 0 0.5rem; }
        .ProseMirror h2 { font-size: 1.4rem; font-weight: bold; margin: 0.75rem 0 0.4rem; }
        .ProseMirror h3 { font-size: 1.2rem; font-weight: bold; margin: 0.6rem 0 0.3rem; }
        .ProseMirror ul { padding-left: 1.5rem; list-style: disc; }
        .ProseMirror ol { padding-left: 1.5rem; list-style: decimal; }
        .ProseMirror blockquote { border-left: 3px solid #cbd5e0; padding-left: 1rem; color: #718096; margin: 0.5rem 0; }
        .ProseMirror code { background: #edf2f7; padding: 0.1rem 0.3rem; border-radius: 4px; font-family: monospace; }
        .ProseMirror pre { background: #2d3748; color: white; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        .ProseMirror a { color: #3182ce; text-decoration: underline; }
        .ProseMirror hr { border: none; border-top: 2px solid #e2e8f0; margin: 1rem 0; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #a0aec0; pointer-events: none; float: left; height: 0; }
      `}</style>
    </div>
  );
}
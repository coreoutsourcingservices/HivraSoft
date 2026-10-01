"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  ChevronDown,
  Code2,
  Eraser,
  Fullscreen,
  Highlighter,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  MinusCircle,
  Plus,
  Quote,
  Redo2,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table2,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  Unlink2,
} from "lucide-react";
import type { BlogImage } from "@/lib/blog";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<BlogImage>;
  disabled?: boolean;
};

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => attributes.fontSize ? { style: `font-size:${attributes.fontSize}` } : {},
          },
        },
      },
    ];
  },
});

const StyledImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "70%",
        parseHTML: (element) => element.getAttribute("data-width") || element.style.width || "70%",
        renderHTML: (attributes) => ({ "data-width": attributes.width }),
      },
      cloudinaryPublicId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-cloudinary-public-id") || "",
        renderHTML: (attributes) => attributes.cloudinaryPublicId
          ? { "data-cloudinary-public-id": attributes.cloudinaryPublicId }
          : {},
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          const explicit = element.getAttribute("data-align");
          if (explicit) return explicit;
          if (element.style.marginLeft === "auto" && element.style.marginRight === "0px") return "right";
          if (element.style.marginLeft === "0px" && element.style.marginRight === "auto") return "left";
          return "center";
        },
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const align = String(HTMLAttributes["data-align"] || "center");
    const width = String(HTMLAttributes["data-width"] || "70%");
    const margin = align === "left" ? "0 auto 22px 0" : align === "right" ? "0 0 22px auto" : "0 auto 22px auto";
    const attrs = {
      ...HTMLAttributes,
      loading: "lazy",
      decoding: "async",
      style: `width:${width};max-width:100%;max-height:620px;height:auto;object-fit:contain;display:block;margin:${margin};border-radius:14px;`,
    };
    return ["img", attrs];
  },
});

function cleanPastedHtml(html: string) {
  if (typeof window === "undefined") return html;
  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script,style,meta,link,xml").forEach((node) => node.remove());
  document.body.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || name.startsWith("xmlns") || name === "lang") node.removeAttribute(attribute.name);
    });
    const element = node as HTMLElement;
    if (element.className && /(^|\s)Mso/i.test(element.className)) element.removeAttribute("class");
    const style = element.getAttribute("style");
    if (style) {
      const clean = style
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part && !/^mso-/i.test(part) && !/^tab-stops:/i.test(part) && !/^text-autospace:/i.test(part))
        .join(";");
      clean ? element.setAttribute("style", clean) : element.removeAttribute("style");
    }
  });
  return document.body.innerHTML;
}

function ToolButton({ title, active, disabled, onClick, children }: { title: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 transition ${active ? "bg-[#F3E7EC] text-[#A51D45]" : "text-[#211A18]/65 hover:bg-[#F7F3F0] hover:text-[#211A18]"} disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-[#211A18]/10" />;
}

function setTextSize(editor: Editor, value: string) {
  if (!value) {
    editor.chain().focus().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
    return;
  }
  editor.chain().focus().setMark("textStyle", { fontSize: `${value}px` }).run();
}

export default function WordBlogEditor({ value, onChange, onImageUpload, disabled = false }: Props) {
  const [zoom, setZoom] = useState(100);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value || "");
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");
  const uploadNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const extensions = useMemo(() => [
    StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
    Underline,
    TextStyle,
    FontSize,
    FontFamily,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
    Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
    StyledImage.configure({ inline: false, allowBase64: false }),
    Table.configure({ resizable: true, HTMLAttributes: { class: "blog-editor-table" } }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({ placeholder: "Start writing your blog..." }),
    Superscript,
    Subscript,
  ], []);

  const editor = useEditor({
    extensions,
    content: value || "",
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      transformPastedHTML: cleanPastedHtml,
      attributes: {
        class: "word-blog-prose focus:outline-none",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML();
      setSourceHtml(html);
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || sourceMode) return;
    const next = value || "";
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, false);
      setSourceHtml(next);
    }
  }, [editor, sourceMode, value]);

  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [fullscreen]);

  useEffect(() => () => {
    if (uploadNoticeTimerRef.current) clearTimeout(uploadNoticeTimerRef.current);
  }, []);

  if (!editor) {
    return <div className="flex min-h-[700px] items-center justify-center rounded-[20px] border border-[#211A18]/10 bg-white text-xs text-[#211A18]/45"><Loader2 className="mr-2 animate-spin" size={16} /> Loading editor...</div>;
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter link URL", previous);
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const targetNew = window.confirm("Open link in a new tab?");
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim(), target: targetNew ? "_blank" : null }).run();
  };

  const toggleSource = () => {
    if (sourceMode) {
      editor.commands.setContent(sourceHtml || "", false);
      onChange(editor.getHTML());
      setSourceMode(false);
    } else {
      setSourceHtml(editor.getHTML());
      setSourceMode(true);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setUploadNotice("Uploading image to Cloudinary...");
      const image = await onImageUpload(file);
      if (!image?.url) throw new Error("Cloudinary did not return an image URL.");

      const ratio = image.width && image.height ? image.width / image.height : 1;
      const defaultWidth = ratio < 0.85 ? "42%" : ratio > 1.55 ? "78%" : "62%";

      editor.chain().focus().setImage({
        src: image.url,
        alt: image.alt || file.name.replace(/\.[^.]+$/, ""),
        title: image.title || image.alt || "",
      }).run();
      editor.chain().focus().updateAttributes("image", {
        width: defaultWidth,
        align: "center",
        cloudinaryPublicId: image.publicId || "",
      }).run();

      setUploadNotice("Uploaded to Cloudinary and inserted into the document.");
      if (uploadNoticeTimerRef.current) clearTimeout(uploadNoticeTimerRef.current);
      uploadNoticeTimerRef.current = setTimeout(() => setUploadNotice(""), 3200);
    } catch (error) {
      setUploadNotice(error instanceof Error ? error.message : "Image upload failed.");
      if (uploadNoticeTimerRef.current) clearTimeout(uploadNoticeTimerRef.current);
      uploadNoticeTimerRef.current = setTimeout(() => setUploadNotice(""), 4200);
      throw error;
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const headingLevel = ([1, 2, 3, 4, 5, 6] as const).find((level) => editor.isActive("heading", { level }));
  const selectedImage = editor.isActive("image");
  const selectedTable = editor.isActive("table");

  const rootClass = fullscreen
    ? "fixed inset-0 z-[100] flex flex-col bg-[#F2F2F2]"
    : "overflow-hidden rounded-[24px] border border-[#211A18]/10 bg-[#F3F1EF] shadow-[0_18px_45px_rgba(33,26,24,0.08)]";

  return (
    <div className={rootClass}>
      <div className="sticky top-0 z-20 border-b border-[#211A18]/10 bg-white/95 shadow-[0_6px_18px_rgba(33,26,24,0.05)] backdrop-blur">
        <div className="flex min-h-[54px] flex-wrap items-center gap-x-1 gap-y-1.5 px-2 py-2 sm:px-3">
          <ToolButton title="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={17} /></ToolButton>
          <ToolButton title="Redo (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={17} /></ToolButton>
          <Divider />

          <ToolButton title="Zoom out" disabled={zoom <= 70} onClick={() => setZoom((current) => Math.max(70, current - 10))}><Minus size={16} /></ToolButton>
          <span className="min-w-[48px] text-center text-[11px] font-medium text-[#211A18]/60">{zoom}%</span>
          <ToolButton title="Zoom in" disabled={zoom >= 140} onClick={() => setZoom((current) => Math.min(140, current + 10))}><Plus size={16} /></ToolButton>
          <Divider />

          <label className="relative flex h-9 items-center rounded-lg border border-transparent bg-white px-2 text-[11px] text-[#211A18]/70 hover:bg-[#F7F3F0]">
            <select
              aria-label="Paragraph or heading"
              value={headingLevel ? `h${headingLevel}` : "paragraph"}
              onChange={(event) => {
                const next = event.target.value;
                if (next === "paragraph") editor.chain().focus().setParagraph().run();
                else editor.chain().focus().toggleHeading({ level: Number(next.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
              }}
              className="appearance-none bg-transparent pr-5 outline-none"
            >
              <option value="paragraph">Paragraph</option>
              <option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option><option value="h5">Heading 5</option><option value="h6">Heading 6</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-1.5" />
          </label>

          <select
            aria-label="Font family"
            defaultValue=""
            onChange={(event) => event.target.value ? editor.chain().focus().setFontFamily(event.target.value).run() : editor.chain().focus().unsetFontFamily().run()}
            className="h-9 rounded-lg bg-white px-2 text-[11px] text-[#211A18]/70 outline-none hover:bg-[#F7F3F0]"
          >
            <option value="">Font</option><option value="Arial">Arial</option><option value="Inter">Inter</option><option value="Roboto">Roboto</option><option value="Poppins">Poppins</option><option value="Georgia">Georgia</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option>
          </select>

          <select
            aria-label="Font size"
            defaultValue=""
            onChange={(event) => setTextSize(editor, event.target.value)}
            className="h-9 w-[62px] rounded-lg bg-white px-2 text-[11px] text-[#211A18]/70 outline-none hover:bg-[#F7F3F0]"
          >
            <option value="">Size</option>{[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <Divider />

          <ToolButton title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={17} /></ToolButton>
          <ToolButton title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={17} /></ToolButton>
          <ToolButton title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={17} /></ToolButton>
          <ToolButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={17} /></ToolButton>
          <ToolButton title="Superscript" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SuperscriptIcon size={17} /></ToolButton>
          <ToolButton title="Subscript" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubscriptIcon size={17} /></ToolButton>

          <label title="Text color" className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#211A18]/65 hover:bg-[#F7F3F0]">
            <span className="text-sm font-bold">A</span><span className="absolute bottom-1 h-[3px] w-4 rounded bg-[#A51D45]" />
            <input type="color" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => editor.chain().focus().setColor(event.target.value).run()} />
          </label>
          <label title="Highlight color" className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#211A18]/65 hover:bg-[#F7F3F0]">
            <Highlighter size={17} />
            <input type="color" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => editor.chain().focus().toggleHighlight({ color: event.target.value }).run()} />
          </label>

          <div className="basis-full" />

          <ToolButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={17} /></ToolButton>
          <ToolButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={17} /></ToolButton>
          <ToolButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={17} /></ToolButton>
          <ToolButton title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify size={17} /></ToolButton>
          <Divider />

          <ToolButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={17} /></ToolButton>
          <ToolButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={17} /></ToolButton>
          <ToolButton title="Indent" onClick={() => editor.chain().focus().sinkListItem("listItem").run()}><IndentIncrease size={17} /></ToolButton>
          <ToolButton title="Outdent" onClick={() => editor.chain().focus().liftListItem("listItem").run()}><IndentDecrease size={17} /></ToolButton>
          <ToolButton title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={17} /></ToolButton>
          <ToolButton title="Horizontal line" onClick={() => editor.chain().focus().setHorizontalRule().run()}><MinusCircle size={17} /></ToolButton>
          <Divider />

          <ToolButton title="Add / edit link" active={editor.isActive("link")} onClick={setLink}><Link2 size={17} /></ToolButton>
          <ToolButton title="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}><Unlink2 size={17} /></ToolButton>
          <ToolButton title={uploading ? "Uploading image to Cloudinary..." : "Upload image to Cloudinary"} disabled={uploading} onClick={() => fileInputRef.current?.click()}>{uploading ? <Loader2 size={17} className="animate-spin" /> : <ImageIcon size={17} />}</ToolButton>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} />
          <ToolButton title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={17} /></ToolButton>
          <Divider />

          <ToolButton title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser size={17} /></ToolButton>
          <ToolButton title="HTML source" active={sourceMode} onClick={toggleSource}><Braces size={17} /></ToolButton>
          <ToolButton title={fullscreen ? "Exit fullscreen" : "Fullscreen"} active={fullscreen} onClick={() => setFullscreen((current) => !current)}><Fullscreen size={17} /></ToolButton>
        </div>

        {uploadNotice && (
          <div className={`border-t px-4 py-2 text-[10px] font-semibold ${uploadNotice.startsWith("Uploaded") ? "border-emerald-100 bg-emerald-50 text-emerald-700" : uploading ? "border-sky-100 bg-sky-50 text-sky-700" : "border-red-100 bg-red-50 text-red-700"}`}>
            {uploadNotice}
          </div>
        )}

        {(selectedImage || selectedTable) && !sourceMode && (
          <div className="flex flex-wrap items-center gap-1 border-t border-[#211A18]/8 bg-[#FFFDFC] px-3 py-2">
            {selectedImage && <>
              <span className="mr-2 text-[9px] font-semibold uppercase tracking-wider text-[#211A18]/35">Image</span>
              <ToolButton title="Image left" onClick={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()}><AlignLeft size={15} /></ToolButton>
              <ToolButton title="Image center" onClick={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()}><AlignCenter size={15} /></ToolButton>
              <ToolButton title="Image right" onClick={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()}><AlignRight size={15} /></ToolButton>
              {["35%", "50%", "70%", "100%"].map((width) => <button key={width} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().updateAttributes("image", { width }).run()} className="h-8 rounded-lg border border-[#211A18]/10 bg-white px-2.5 text-[9px] font-semibold text-[#211A18]/55 shadow-sm hover:border-[#A51D45]/25 hover:text-[#A51D45]">{width === "35%" ? "Small" : width === "50%" ? "Medium" : width === "70%" ? "Large" : "Full"}</button>)}
              <ToolButton title="Delete image" onClick={() => editor.chain().focus().deleteSelection().run()}><Trash2 size={15} /></ToolButton>
            </>}
            {selectedTable && <>
              <span className="mr-2 text-[9px] font-semibold uppercase tracking-wider text-[#211A18]/35">Table</span>
              <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="table-action">+ Row</button>
              <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="table-action">- Row</button>
              <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="table-action">+ Column</button>
              <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="table-action">- Column</button>
              <button type="button" onClick={() => editor.chain().focus().mergeOrSplit().run()} className="table-action">Merge / Split</button>
              <ToolButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 size={15} /></ToolButton>
            </>}
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${fullscreen ? "h-[calc(100vh-108px)]" : "max-h-[calc(100vh-190px)] min-h-[760px]"}`}>
        <div className="min-h-full px-2 py-6 sm:px-5 sm:py-9 lg:px-8">
          <div
            className="mx-auto origin-top overflow-hidden rounded-[10px] border border-black/[0.045] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_24px_70px_rgba(33,26,24,0.08)]"
            style={{ maxWidth: 900, minHeight: 900, zoom: zoom / 100 } as CSSProperties}
          >
            {sourceMode ? (
              <textarea
                value={sourceHtml}
                onChange={(event) => { setSourceHtml(event.target.value); onChange(event.target.value); }}
                spellCheck={false}
                className="min-h-[900px] w-full resize-none bg-[#171717] p-8 font-mono text-[13px] leading-6 text-[#F5F5F5] outline-none sm:p-12"
              />
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .word-blog-prose { min-height: 900px; padding: 64px 76px 96px; color: #211A18; font-family: Arial, Helvetica, sans-serif; font-size: 17px; line-height: 1.75; }
        .word-blog-prose > *:first-child { margin-top: 0; }
        .word-blog-prose p { margin: 0 0 18px; }
        .word-blog-prose h1 { margin: 0 0 24px; font-size: 38px; line-height: 1.2; font-weight: 800; }
        .word-blog-prose h2 { margin: 34px 0 16px; font-size: 30px; line-height: 1.3; font-weight: 750; }
        .word-blog-prose h3 { margin: 28px 0 14px; font-size: 24px; line-height: 1.35; font-weight: 700; }
        .word-blog-prose h4 { margin: 24px 0 12px; font-size: 20px; line-height: 1.4; font-weight: 700; }
        .word-blog-prose h5 { margin: 22px 0 10px; font-size: 18px; line-height: 1.4; font-weight: 700; }
        .word-blog-prose h6 { margin: 20px 0 10px; font-size: 16px; line-height: 1.4; font-weight: 700; }
        .word-blog-prose ul, .word-blog-prose ol { margin: 0 0 20px; padding-left: 28px; }
        .word-blog-prose ul { list-style: disc; } .word-blog-prose ol { list-style: decimal; }
        .word-blog-prose li { margin: 5px 0; }
        .word-blog-prose blockquote { margin: 24px 0; border-left: 4px solid #A51D45; padding: 10px 0 10px 18px; color: rgb(33 26 24 / .68); font-style: italic; }
        .word-blog-prose a { color: #A51D45; text-decoration: underline; text-underline-offset: 2px; }
        .word-blog-prose hr { margin: 30px 0; border: 0; border-top: 1px solid rgb(33 26 24 / .15); }
        .word-blog-prose pre { margin: 22px 0; overflow: auto; border-radius: 12px; background: #211A18; padding: 18px; color: white; font-size: 13px; line-height: 1.6; }
        .word-blog-prose img { background: #FAF8F6; box-shadow: 0 8px 24px rgb(33 26 24 / .06); }
        .word-blog-prose img.ProseMirror-selectednode { outline: 3px solid rgb(165 29 69 / .28); outline-offset: 4px; }
        .word-blog-prose table { width: 100%; margin: 22px 0; border-collapse: collapse; table-layout: fixed; overflow: hidden; }
        .word-blog-prose th, .word-blog-prose td { position: relative; min-width: 80px; border: 1px solid rgb(33 26 24 / .18); padding: 10px 12px; vertical-align: top; }
        .word-blog-prose th { background: #F8F5F2; font-weight: 700; }
        .word-blog-prose .selectedCell:after { position: absolute; inset: 0; z-index: 2; pointer-events: none; content: ""; background: rgb(165 29 69 / .08); }
        .word-blog-prose .column-resize-handle { position: absolute; top: 0; right: -2px; bottom: -2px; width: 4px; background: #A51D45; pointer-events: none; }
        .word-blog-prose p.is-editor-empty:first-child::before { float: left; height: 0; pointer-events: none; color: rgb(33 26 24 / .32); content: attr(data-placeholder); }
        .table-action { height: 32px; border: 1px solid rgb(33 26 24 / .10); border-radius: 8px; background: white; padding: 0 10px; font-size: 9px; font-weight: 600; color: rgb(33 26 24 / .62); }
        @media (max-width: 768px) { .word-blog-prose { min-height: 760px; padding: 36px 26px 60px; font-size: 16px; } .word-blog-prose h1 { font-size: 32px; } .word-blog-prose h2 { font-size: 26px; } .word-blog-prose img { width: min(100%, var(--editor-image-width, 100%)); } }
      `}</style>
    </div>
  );
}

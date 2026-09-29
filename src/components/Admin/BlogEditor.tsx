"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Bold,
  Code2,
  Copy,
  FileText,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  Loader2,
  Minus,
  Plus,
  Quote,
  Save,
  Trash2,
  Underline,
  Video,
} from "lucide-react";
import {
  createAdminBlog,
  getAdminBlog,
  getBlogCategories,
  getBlogTags,
  updateAdminBlog,
  uploadBlogImage,
  type BlogBlock,
  type BlogImage,
  type BlogTaxonomy,
} from "@/lib/blog";

const emptyImage: BlogImage = { url: "", publicId: "", alt: "", title: "", caption: "", width: 0, height: 0 };

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uid() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newBlock(type: string): BlogBlock {
  const defaults: Record<string, Record<string, any>> = {
    heading: { level: 2, text: "New heading" },
    paragraph: { text: "Write your paragraph here..." },
    image: { ...emptyImage, link: "" },
    quote: { text: "Add a meaningful quote." },
    list: { ordered: false, items: ["First item", "Second item"] },
    button: { text: "Learn More", href: "#" },
    divider: {},
    code: { code: "// Add code here" },
    html: { html: "<div>Custom HTML</div>" },
    faq: { items: [{ question: "Question", answer: "Answer" }] },
    callout: { text: "Important information" },
    video: { url: "https://www.youtube.com/embed/", title: "Video" },
    spacer: { height: 32 },
    table: { rows: [["Column 1", "Column 2"], ["Value 1", "Value 2"]] },
    columns: { columns: [{ html: "Left column" }, { html: "Right column" }] },
  };
  return {
    id: uid(),
    type,
    data: defaults[type] || {},
    style: { textAlign: "left", color: "", backgroundColor: "", fontSize: "", margin: "", padding: "", borderRadius: "" },
    className: "",
    anchorId: "",
  };
}

function stripHtml(value: string) {
  if (typeof window === "undefined") return value.replace(/<[^>]+>/g, " ");
  const el = document.createElement("div");
  el.innerHTML = value;
  return el.textContent || "";
}

function taxId(value: BlogTaxonomy | string | null | undefined) {
  return typeof value === "string" ? value : value?._id || "";
}

function taxName(value: BlogTaxonomy | string | null | undefined) {
  return typeof value === "string" ? value : value?.name || "";
}

function formatDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function BlogEditor({ blogId }: { blogId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [blocks, setBlocks] = useState<BlogBlock[]>([newBlock("paragraph")]);
  const [featuredImage, setFeaturedImage] = useState<BlogImage>(emptyImage);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<BlogTaxonomy[]>([]);
  const [tagOptions, setTagOptions] = useState<BlogTaxonomy[]>([]);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "SCHEDULED" | "PRIVATE">("DRAFT");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [customCss, setCustomCss] = useState("");
  const [seo, setSeo] = useState<any>({
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    canonicalUrl: "",
    focusKeyword: "",
    secondaryKeywords: [],
    robots: { index: true, follow: true },
    openGraph: { title: "", description: "", image: "" },
    twitter: { title: "", description: "", image: "" },
  });
  const [loading, setLoading] = useState(Boolean(blogId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState("");
  const [dirty, setDirty] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const localKey = `hivrasoft-blog-draft:${blogId || "new"}`;

  useEffect(() => {
    void Promise.all([getBlogCategories(), getBlogTags()])
      .then(([cats, tgs]) => { setCategories(cats); setTagOptions(tgs); })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!blogId) {
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft?.title) {
            setTitle(draft.title || "");
            setSlug(draft.slug || "");
            setSlugEdited(Boolean(draft.slug));
            setExcerpt(draft.excerpt || "");
            setBlocks(Array.isArray(draft.blocks) && draft.blocks.length ? draft.blocks : [newBlock("paragraph")]);
            setFeaturedImage(draft.featuredImage || emptyImage);
            setCategory(draft.category || "");
            setTags(Array.isArray(draft.tags) ? draft.tags : []);
            setSeo(draft.seo || seo);
            setIsFeatured(Boolean(draft.isFeatured));
            setCustomCss(draft.customCss || "");
            setMessage("Recovered your local autosave draft.");
          }
        }
      } catch { /* ignore invalid local draft */ }
      return;
    }

    setLoading(true);
    void getAdminBlog(blogId)
      .then((blog) => {
        setTitle(blog.title || "");
        setSlug(blog.slug || "");
        setSlugEdited(true);
        setExcerpt(blog.excerpt || "");
        setBlocks(Array.isArray(blog.blocks) && blog.blocks.length ? blog.blocks : [newBlock("paragraph")]);
        setFeaturedImage(blog.featuredImage || emptyImage);
        setCategory(taxId(blog.category));
        setTags((blog.tags || []).map(taxId).filter(Boolean));
        setStatus(blog.status || "DRAFT");
        setScheduledAt(formatDateInput(blog.scheduledAt));
        setIsFeatured(Boolean(blog.isFeatured));
        setSeo(blog.seo || {});
        setCustomCss(blog.customCss || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load blog."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title));
  }, [title, slugEdited]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!dirty || !title.trim()) return;
      try {
        localStorage.setItem(localKey, JSON.stringify({ title, slug, excerpt, blocks, featuredImage, category, tags, seo, isFeatured, customCss, savedAt: new Date().toISOString() }));
        setMessage("Local autosave saved.");
      } catch { /* storage can be unavailable */ }
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [blocks, category, customCss, dirty, excerpt, featuredImage, isFeatured, localKey, seo, slug, tags, title]);

  const markDirty = () => setDirty(true);

  function updateBlock(index: number, patch: Partial<BlogBlock>) {
    setBlocks((current) => current.map((block, i) => i === index ? { ...block, ...patch } : block));
    markDirty();
  }

  function updateBlockData(index: number, patch: Record<string, any>) {
    setBlocks((current) => current.map((block, i) => i === index ? { ...block, data: { ...block.data, ...patch } } : block));
    markDirty();
  }

  function updateBlockStyle(index: number, patch: Record<string, any>) {
    setBlocks((current) => current.map((block, i) => i === index ? { ...block, style: { ...(block.style || {}), ...patch } } : block));
    markDirty();
  }

  function addBlock(type: string) {
    setBlocks((current) => [...current, newBlock(type)]);
    markDirty();
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((current) => {
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
    markDirty();
  }

  function duplicateBlock(index: number) {
    const copy = { ...blocks[index], id: uid(), data: structuredClone(blocks[index].data), style: { ...(blocks[index].style || {}) } };
    setBlocks((current) => [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
    markDirty();
  }

  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, i) => i !== index));
    markDirty();
  }

  function dropBlock(index: number) {
    if (dragIndex.current === null || dragIndex.current === index) return;
    const from = dragIndex.current;
    setBlocks((current) => {
      const copy = [...current];
      const [moved] = copy.splice(from, 1);
      copy.splice(index, 0, moved);
      return copy;
    });
    dragIndex.current = null;
    markDirty();
  }

  async function uploadImage(file: File, target: "featured" | number) {
    try {
      setUploading(String(target));
      setError("");
      const image = await uploadBlogImage(file, `${slug || "blog"}-${target === "featured" ? "featured" : `block-${target + 1}`}`);
      const value: BlogImage = { url: image.url, publicId: image.publicId, width: image.width, height: image.height, alt: image.alt || image.name || title, title: image.name || "", caption: "" };
      if (target === "featured") setFeaturedImage(value);
      else updateBlockData(target, value);
      markDirty();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading("");
    }
  }

  const payload = useCallback((statusOverride?: typeof status) => ({
    title,
    slug,
    excerpt,
    blocks,
    featuredImage,
    category: category || null,
    tags,
    status: statusOverride || status,
    scheduledAt: (statusOverride || status) === "SCHEDULED" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    isFeatured,
    customCss,
    seo,
  }), [blocks, category, customCss, excerpt, featuredImage, isFeatured, scheduledAt, seo, slug, status, tags, title]);

  async function save(statusOverride?: typeof status) {
    if (!title.trim()) { setError("Blog title is required."); return; }
    if (!slug.trim()) { setError("Blog slug is required."); return; }
    if ((statusOverride || status) === "SCHEDULED" && !scheduledAt) { setError("Choose a scheduled publish date/time."); return; }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = blogId ? await updateAdminBlog(blogId, payload(statusOverride)) : await createAdminBlog(payload(statusOverride));
      setStatus(result.blog.status);
      setDirty(false);
      localStorage.removeItem(localKey);
      setMessage(statusOverride === "PUBLISHED" ? "Blog published successfully." : "Blog saved successfully.");
      if (!blogId) router.replace(`/admin/blog/${result.blog._id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save blog.");
    } finally {
      setSaving(false);
    }
  }

  const plainText = useMemo(() => blocks.map((block) => {
    const data = block.data || {};
    if (block.type === "heading" || block.type === "paragraph" || block.type === "quote" || block.type === "callout") return stripHtml(String(data.text || ""));
    if (block.type === "list") return (Array.isArray(data.items) ? data.items : []).join(" ");
    if (block.type === "faq") return (Array.isArray(data.items) ? data.items : []).map((x: any) => `${x.question || ""} ${stripHtml(x.answer || "")}`).join(" ");
    return "";
  }).join(" "), [blocks]);

  const seoChecks = useMemo(() => {
    const focus = String(seo.focusKeyword || "").trim().toLowerCase();
    const meta = String(seo.metaDescription || "");
    const imageBlocks = blocks.filter((block) => block.type === "image");
    const blockH1 = blocks.filter((block) => block.type === "heading" && Number(block.data?.level || 2) === 1).length;
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    return [
      { label: "Focus keyword in title", ok: !focus || title.toLowerCase().includes(focus) },
      { label: "Focus keyword in slug", ok: !focus || slug.toLowerCase().includes(slugify(focus)) },
      { label: "Focus keyword in meta description", ok: !focus || meta.toLowerCase().includes(focus) },
      { label: "Single main H1", ok: blockH1 === 0, note: blockH1 ? "Blog title is already H1; use H2/H3 inside content." : "Blog title supplies the H1." },
      { label: "Images have ALT text", ok: imageBlocks.every((block) => Boolean(String(block.data?.alt || "").trim())) },
      { label: "SEO title length", ok: String(seo.metaTitle || title).length >= 40 && String(seo.metaTitle || title).length <= 65 },
      { label: "Meta description length", ok: meta.length >= 120 && meta.length <= 170 },
      { label: `Word count: ${wordCount}`, ok: wordCount >= 300 },
    ];
  }, [blocks, plainText, seo.focusKeyword, seo.metaDescription, seo.metaTitle, slug, title]);

  if (loading) return <div className="rounded-2xl border border-[#211A18]/10 bg-white p-16 text-center text-xs text-[#211A18]/45"><Loader2 className="mx-auto mb-3 animate-spin" />Loading blog editor...</div>;

  return (
    <section className="mx-auto w-full max-w-[1700px]">
      <div className="mb-5 flex flex-col gap-3 rounded-[22px] border border-[#211A18]/10 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8C1839]">Blog Builder</p>
          <h2 className="mt-1 text-xl font-semibold text-[#211A18]">{blogId ? "Edit Blog" : "Add New Blog"}</h2>
          <p className="mt-1 text-[10px] text-[#211A18]/45">Block editor, media, SEO, draft/publish/schedule and local autosave.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowPreview((v) => !v)} className="h-10 rounded-xl border border-[#211A18]/10 bg-white px-4 text-[10px] font-semibold">{showPreview ? "Edit" : "Preview"}</button>
          <button type="button" disabled={saving} onClick={() => void save("DRAFT")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#8C1839]/20 px-4 text-[10px] font-semibold text-[#8C1839] disabled:opacity-50"><Save size={13}/>Save Draft</button>
          <button type="button" disabled={saving} onClick={() => void save("PUBLISHED")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#A51D45] px-4 text-[10px] font-semibold text-white disabled:opacity-50">{saving ? <Loader2 size={13} className="animate-spin"/> : null}Publish</button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
      {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{message}</div>}

      {showPreview ? (
        <BlogPreview title={title} excerpt={excerpt} featuredImage={featuredImage} blocks={blocks} customCss={customCss} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="rounded-[22px] border border-[#211A18]/10 bg-white p-5">
              <label className="block"><span className="mb-2 block text-[9px] font-semibold uppercase tracking-wider text-[#211A18]/45">Blog Title</span><input value={title} onChange={(e) => { setTitle(e.target.value); markDirty(); }} placeholder="Enter blog title" className="h-14 w-full rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-lg font-semibold outline-none focus:border-[#8C1839]/40" /></label>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label><span className="mb-2 block text-[9px] font-semibold uppercase tracking-wider text-[#211A18]/45">Slug</span><input value={slug} onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); markDirty(); }} className="h-11 w-full rounded-xl border border-[#211A18]/10 px-3 text-xs outline-none" /></label>
                <label><span className="mb-2 block text-[9px] font-semibold uppercase tracking-wider text-[#211A18]/45">Excerpt</span><input value={excerpt} onChange={(e) => { setExcerpt(e.target.value); markDirty(); }} placeholder="Short blog summary" className="h-11 w-full rounded-xl border border-[#211A18]/10 px-3 text-xs outline-none" /></label>
              </div>
            </div>

            <BlockPalette onAdd={addBlock} />

            <div className="space-y-3">
              {blocks.length === 0 ? <div className="rounded-[22px] border border-dashed border-[#211A18]/15 bg-white p-12 text-center text-xs text-[#211A18]/40">Add a block from the toolbar above.</div> : blocks.map((block, index) => (
                <BlockCard key={block.id} block={block} index={index} total={blocks.length} uploading={uploading} onData={(patch) => updateBlockData(index, patch)} onStyle={(patch) => updateBlockStyle(index, patch)} onBlock={(patch) => updateBlock(index, patch)} onMove={(dir) => moveBlock(index, dir)} onDuplicate={() => duplicateBlock(index)} onDelete={() => removeBlock(index)} onUpload={(file) => void uploadImage(file, index)} onDragStart={() => { dragIndex.current = index; }} onDrop={() => dropBlock(index)} />
              ))}
            </div>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-[96px] xl:self-start">
            <Panel title="Publish">
              <label className="block"><FieldLabel>Status</FieldLabel><select value={status} onChange={(e) => { setStatus(e.target.value as any); markDirty(); }} className="field"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="SCHEDULED">Scheduled</option><option value="PRIVATE">Private</option></select></label>
              {status === "SCHEDULED" && <label className="mt-3 block"><FieldLabel>Publish At</FieldLabel><input type="datetime-local" value={scheduledAt} onChange={(e) => { setScheduledAt(e.target.value); markDirty(); }} className="field" /></label>}
              <label className="mt-3 flex items-center gap-2 text-[10px] font-semibold"><input type="checkbox" checked={isFeatured} onChange={(e) => { setIsFeatured(e.target.checked); markDirty(); }} className="accent-[#8C1839]"/>Featured Blog</label>
              <button type="button" onClick={() => void save(status)} disabled={saving} className="mt-4 h-11 w-full rounded-xl bg-[#211A18] text-[10px] font-semibold text-white disabled:opacity-50">Save / Update</button>
            </Panel>

            <Panel title="Featured Image">
              {featuredImage.url ? <img src={featuredImage.url} alt={featuredImage.alt || title} className="mb-3 aspect-video w-full rounded-xl object-cover"/> : <div className="mb-3 flex aspect-video items-center justify-center rounded-xl bg-[#FAF8F6] text-[10px] text-[#211A18]/35">No featured image</div>}
              <label className="block cursor-pointer rounded-xl border border-dashed border-[#8C1839]/30 p-3 text-center text-[10px] font-semibold text-[#8C1839]">{uploading === "featured" ? "Uploading..." : "Upload / Replace Image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => { const file=e.target.files?.[0]; if(file) void uploadImage(file, "featured"); }} /></label>
              {featuredImage.url && <><input value={featuredImage.alt || ""} onChange={(e) => { setFeaturedImage((v) => ({...v,alt:e.target.value})); markDirty(); }} placeholder="ALT text" className="field mt-3"/><button type="button" onClick={() => { setFeaturedImage(emptyImage); markDirty(); }} className="mt-2 text-[9px] font-semibold text-red-600">Remove image</button></>}
            </Panel>

            <Panel title="Category & Tags">
              <label className="block"><FieldLabel>Category</FieldLabel><select value={category} onChange={(e) => { setCategory(e.target.value); markDirty(); }} className="field"><option value="">No category</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
              <div className="mt-3"><FieldLabel>Tags</FieldLabel><div className="max-h-36 space-y-2 overflow-auto rounded-xl border border-[#211A18]/10 p-3">{tagOptions.length ? tagOptions.map((tag) => <label key={tag._id} className="flex items-center gap-2 text-[10px]"><input type="checkbox" checked={tags.includes(tag._id)} onChange={(e) => { setTags((current) => e.target.checked ? [...current,tag._id] : current.filter((id)=>id!==tag._id)); markDirty(); }} className="accent-[#8C1839]"/>{tag.name}</label>) : <span className="text-[9px] text-[#211A18]/35">Create tags from Blog → Tags.</span>}</div></div>
            </Panel>

            <Panel title="SEO">
              <SeoFields seo={seo} setSeo={(next: any) => { setSeo(next); markDirty(); }} title={title} featuredImage={featuredImage} />
              <div className="mt-4 space-y-2">{seoChecks.map((check) => <div key={check.label} className="flex items-start justify-between gap-3 rounded-lg bg-[#FAF8F6] px-3 py-2 text-[9px]"><div><div>{check.label}</div>{check.note && <div className="mt-1 text-[#211A18]/40">{check.note}</div>}</div><span className={`shrink-0 font-semibold ${check.ok ? "text-emerald-600" : "text-amber-600"}`}>{check.ok ? "Good" : "Needs Improvement"}</span></div>)}</div>
            </Panel>

            <Panel title="Advanced CSS">
              <textarea value={customCss} onChange={(e) => { setCustomCss(e.target.value); markDirty(); }} rows={6} placeholder=".blog-content .my-class { ... }" className="w-full rounded-xl border border-[#211A18]/10 p-3 font-mono text-[10px] outline-none" />
              <p className="mt-2 text-[9px] leading-4 text-[#211A18]/40">CSS is scoped by your blog markup on the frontend. JavaScript is not accepted.</p>
            </Panel>
          </aside>
        </div>
      )}
    </section>
  );
}

function BlockPalette({ onAdd }: { onAdd: (type: string) => void }) {
  const tools = [
    ["paragraph", "Paragraph", FileText], ["heading", "Heading", Heading2], ["image", "Image", ImageIcon], ["list", "List", List], ["quote", "Quote", Quote],
    ["button", "Button", Link2], ["video", "Video", Video], ["faq", "FAQ", Plus], ["callout", "Callout", FileText], ["table", "Table", List],
    ["columns", "Columns", FileText], ["code", "Code", Code2], ["html", "Custom HTML", Code2], ["divider", "Divider", Minus], ["spacer", "Spacer", Plus],
  ] as const;
  return <div className="rounded-[22px] border border-[#211A18]/10 bg-white p-4"><div className="mb-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#211A18]/45">Add Content Block</div><div className="flex flex-wrap gap-2">{tools.map(([type,label,Icon]) => <button key={type} type="button" onClick={() => onAdd(type)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[9px] font-semibold hover:border-[#8C1839]/30 hover:text-[#8C1839]"><Icon size={12}/>{label}</button>)}</div></div>;
}

function BlockCard(props: {
  block: BlogBlock; index: number; total: number; uploading: string;
  onData: (patch: Record<string, any>) => void; onStyle: (patch: Record<string, any>) => void; onBlock: (patch: Partial<BlogBlock>) => void;
  onMove: (dir: -1 | 1) => void; onDuplicate: () => void; onDelete: () => void; onUpload: (file: File) => void; onDragStart: () => void; onDrop: () => void;
}) {
  const { block, index, total } = props;
  const data = block.data || {};
  return (
    <div draggable onDragStart={props.onDragStart} onDragOver={(e) => e.preventDefault()} onDrop={props.onDrop} className="rounded-[20px] border border-[#211A18]/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#211A18]/8 pb-3">
        <div><span className="rounded-md bg-[#8C1839]/8 px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#8C1839]">{block.type}</span><span className="ml-2 text-[9px] text-[#211A18]/35">Drag to reorder</span></div>
        <div className="flex gap-1"><IconButton disabled={index===0} onClick={() => props.onMove(-1)} title="Move up"><ArrowUp size={13}/></IconButton><IconButton disabled={index===total-1} onClick={() => props.onMove(1)} title="Move down"><ArrowDown size={13}/></IconButton><IconButton onClick={props.onDuplicate} title="Duplicate"><Copy size={13}/></IconButton><IconButton onClick={props.onDelete} title="Delete" danger><Trash2 size={13}/></IconButton></div>
      </div>

      {block.type === "heading" && <div className="grid gap-3 md:grid-cols-[110px_1fr]"><select value={Number(data.level||2)} onChange={(e)=>props.onData({level:Number(e.target.value)})} className="field"><option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option><option value={4}>H4</option><option value={5}>H5</option><option value={6}>H6</option></select><input value={data.text||""} onChange={(e)=>props.onData({text:e.target.value})} className="field" placeholder="Heading text"/></div>}
      {block.type === "paragraph" && <RichTextEditor value={String(data.text||"")} onChange={(value)=>props.onData({text:value})}/>} 
      {block.type === "quote" && <textarea value={data.text||""} onChange={(e)=>props.onData({text:e.target.value})} rows={3} className="textarea" placeholder="Quote"/>}
      {block.type === "callout" && <RichTextEditor value={String(data.text||"")} onChange={(value)=>props.onData({text:value})}/>} 
      {block.type === "code" && <textarea value={data.code||""} onChange={(e)=>props.onData({code:e.target.value})} rows={6} className="textarea font-mono"/>}
      {block.type === "html" && <textarea value={data.html||""} onChange={(e)=>props.onData({html:e.target.value})} rows={7} className="textarea font-mono" placeholder="Safe HTML. Scripts will be removed."/>}
      {block.type === "button" && <div className="grid gap-3 md:grid-cols-2"><input value={data.text||""} onChange={(e)=>props.onData({text:e.target.value})} className="field" placeholder="Button text"/><input value={data.href||""} onChange={(e)=>props.onData({href:e.target.value})} className="field" placeholder="https://... or /path"/></div>}
      {block.type === "list" && <><label className="mb-2 flex items-center gap-2 text-[10px]"><input type="checkbox" checked={Boolean(data.ordered)} onChange={(e)=>props.onData({ordered:e.target.checked})} className="accent-[#8C1839]"/>Ordered list</label><textarea value={(Array.isArray(data.items)?data.items:[]).join("\n")} onChange={(e)=>props.onData({items:e.target.value.split("\n")})} rows={5} className="textarea" placeholder="One list item per line"/></>}
      {block.type === "image" && <div className="grid gap-4 md:grid-cols-[180px_1fr]">{data.url ? <img src={data.url} alt={data.alt||""} className="aspect-square w-full rounded-xl object-cover"/> : <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#8C1839]/30 bg-[#FAF8F6] text-[9px] font-semibold text-[#8C1839]">{props.uploading===String(index)?"Uploading...":"Upload Image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e)=>{const f=e.target.files?.[0];if(f)props.onUpload(f);}}/></label>}<div className="space-y-2">{data.url && <label className="block cursor-pointer rounded-lg border border-[#211A18]/10 p-2 text-center text-[9px] font-semibold">Replace<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e)=>{const f=e.target.files?.[0];if(f)props.onUpload(f);}}/></label>}<input value={data.alt||""} onChange={(e)=>props.onData({alt:e.target.value})} className="field" placeholder="ALT text"/><input value={data.caption||""} onChange={(e)=>props.onData({caption:e.target.value})} className="field" placeholder="Caption"/><input value={data.link||""} onChange={(e)=>props.onData({link:e.target.value})} className="field" placeholder="Optional link"/></div></div>}
      {block.type === "video" && <div className="grid gap-3 md:grid-cols-2"><input value={data.url||""} onChange={(e)=>props.onData({url:e.target.value})} className="field" placeholder="YouTube/Vimeo embed URL"/><input value={data.title||""} onChange={(e)=>props.onData({title:e.target.value})} className="field" placeholder="Video title"/></div>}
      {block.type === "spacer" && <label><FieldLabel>Height (px)</FieldLabel><input type="number" min={8} max={400} value={Number(data.height||32)} onChange={(e)=>props.onData({height:Number(e.target.value)})} className="field"/></label>}
      {block.type === "divider" && <p className="text-[10px] text-[#211A18]/40">Horizontal divider. Use Advanced Style for margin.</p>}
      {block.type === "faq" && <FaqEditor items={Array.isArray(data.items)?data.items:[]} onChange={(items)=>props.onData({items})}/>} 
      {block.type === "table" && <TableEditor rows={Array.isArray(data.rows)?data.rows:[]} onChange={(rows)=>props.onData({rows})}/>} 
      {block.type === "columns" && <ColumnsEditor columns={Array.isArray(data.columns)?data.columns:[]} onChange={(columns)=>props.onData({columns})}/>} 

      <details className="mt-4 rounded-xl bg-[#FAF8F6] p-3">
        <summary className="cursor-pointer text-[9px] font-semibold uppercase tracking-wider text-[#211A18]/55">Advanced Style / HTML Attributes</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StyleInput label="Text Color" value={String(block.style?.color||"")} onChange={(v)=>props.onStyle({color:v})} placeholder="#211A18"/>
          <StyleInput label="Background" value={String(block.style?.backgroundColor||"")} onChange={(v)=>props.onStyle({backgroundColor:v})} placeholder="#ffffff"/>
          <StyleInput label="Font Size" value={String(block.style?.fontSize||"")} onChange={(v)=>props.onStyle({fontSize:v})} placeholder="18px"/>
          <label><FieldLabel>Alignment</FieldLabel><select value={String(block.style?.textAlign||"left")} onChange={(e)=>props.onStyle({textAlign:e.target.value})} className="field"><option>left</option><option>center</option><option>right</option><option>justify</option></select></label>
          <StyleInput label="Margin" value={String(block.style?.margin||"")} onChange={(v)=>props.onStyle({margin:v})} placeholder="20px 0"/>
          <StyleInput label="Padding" value={String(block.style?.padding||"")} onChange={(v)=>props.onStyle({padding:v})} placeholder="16px"/>
          <StyleInput label="CSS Class" value={block.className||""} onChange={(v)=>props.onBlock({className:v})} placeholder="my-class"/>
          <StyleInput label="Anchor ID" value={block.anchorId||""} onChange={(v)=>props.onBlock({anchorId:v})} placeholder="section-name"/>
        </div>
      </details>
    </div>
  );
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  function command(name: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    onChange(ref.current?.innerHTML || "");
  }
  return <div className="rounded-xl border border-[#211A18]/10"><div className="flex flex-wrap gap-1 border-b border-[#211A18]/8 bg-[#FAF8F6] p-2"><MiniButton onClick={()=>command("bold")}><Bold size={12}/></MiniButton><MiniButton onClick={()=>command("italic")}><Italic size={12}/></MiniButton><MiniButton onClick={()=>command("underline")}><Underline size={12}/></MiniButton><MiniButton onClick={()=>command("strikeThrough")}>S</MiniButton><MiniButton onClick={()=>command("insertUnorderedList")}><List size={12}/></MiniButton><MiniButton onClick={()=>command("insertOrderedList")}>1.</MiniButton><MiniButton onClick={()=>{const url=window.prompt("Link URL");if(url)command("createLink",url);}}><Link2 size={12}/></MiniButton></div><div ref={ref} contentEditable suppressContentEditableWarning onInput={(e)=>onChange(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{__html:value}} className="min-h-28 p-3 text-sm leading-6 outline-none"/></div>;
}

function FaqEditor({ items, onChange }: { items: any[]; onChange: (items: any[])=>void }) { return <div className="space-y-3">{items.map((item,i)=><div key={i} className="rounded-xl bg-[#FAF8F6] p-3"><input value={item.question||""} onChange={(e)=>onChange(items.map((x,j)=>j===i?{...x,question:e.target.value}:x))} className="field" placeholder="Question"/><textarea value={item.answer||""} onChange={(e)=>onChange(items.map((x,j)=>j===i?{...x,answer:e.target.value}:x))} className="textarea mt-2" rows={3} placeholder="Answer"/><button type="button" onClick={()=>onChange(items.filter((_,j)=>j!==i))} className="mt-2 text-[9px] font-semibold text-red-600">Remove</button></div>)}<button type="button" onClick={()=>onChange([...items,{question:"New question",answer:"Answer"}])} className="text-[9px] font-semibold text-[#8C1839]">+ Add FAQ</button></div>; }
function TableEditor({ rows, onChange }: { rows:any[][]; onChange:(rows:any[][])=>void }) { return <textarea rows={6} value={rows.map((r)=>r.join(" | ")).join("\n")} onChange={(e)=>onChange(e.target.value.split("\n").map((line)=>line.split("|").map((cell)=>cell.trim())))} className="textarea" placeholder="Column 1 | Column 2\nValue 1 | Value 2"/>; }
function ColumnsEditor({ columns, onChange }: { columns:any[]; onChange:(columns:any[])=>void }) { const normalized=columns.length?columns:[{html:""},{html:""}]; return <div className="grid gap-3 md:grid-cols-2">{normalized.map((col,i)=><textarea key={i} value={col.html||""} onChange={(e)=>onChange(normalized.map((x,j)=>j===i?{...x,html:e.target.value}:x))} rows={5} className="textarea" placeholder={`Column ${i+1} HTML/text`}/>)}</div>; }

function SeoFields({ seo, setSeo, title, featuredImage }: { seo:any; setSeo:(v:any)=>void; title:string; featuredImage:BlogImage }) {
  const patch=(key:string,value:any)=>setSeo({...seo,[key]:value});
  return <div className="space-y-3"><label><FieldLabel>SEO Title ({String(seo.metaTitle||title).length}/60)</FieldLabel><input value={seo.metaTitle||""} onChange={(e)=>patch("metaTitle",e.target.value)} placeholder={title||"SEO title"} className="field"/></label><label><FieldLabel>Meta Description ({String(seo.metaDescription||"").length}/160)</FieldLabel><textarea value={seo.metaDescription||""} onChange={(e)=>patch("metaDescription",e.target.value)} rows={4} className="textarea"/></label><label><FieldLabel>Focus Keyword</FieldLabel><input value={seo.focusKeyword||""} onChange={(e)=>patch("focusKeyword",e.target.value)} className="field"/></label><label><FieldLabel>Keywords (comma separated)</FieldLabel><input value={(seo.keywords||[]).join(", ")} onChange={(e)=>patch("keywords",e.target.value.split(",").map((v)=>v.trim()).filter(Boolean))} className="field"/></label><label><FieldLabel>Canonical URL</FieldLabel><input value={seo.canonicalUrl||""} onChange={(e)=>patch("canonicalUrl",e.target.value)} className="field"/></label><div className="flex gap-4 text-[9px] font-semibold"><label className="flex items-center gap-2"><input type="checkbox" checked={seo.robots?.index!==false} onChange={(e)=>patch("robots",{...(seo.robots||{}),index:e.target.checked})} className="accent-[#8C1839]"/>Index</label><label className="flex items-center gap-2"><input type="checkbox" checked={seo.robots?.follow!==false} onChange={(e)=>patch("robots",{...(seo.robots||{}),follow:e.target.checked})} className="accent-[#8C1839]"/>Follow</label></div><details className="rounded-xl bg-[#FAF8F6] p-3"><summary className="cursor-pointer text-[9px] font-semibold">Open Graph / Twitter</summary><div className="mt-3 space-y-2"><input value={seo.openGraph?.title||""} onChange={(e)=>patch("openGraph",{...(seo.openGraph||{}),title:e.target.value})} placeholder="OG Title" className="field"/><textarea value={seo.openGraph?.description||""} onChange={(e)=>patch("openGraph",{...(seo.openGraph||{}),description:e.target.value})} placeholder="OG Description" className="textarea" rows={2}/><input value={seo.openGraph?.image||featuredImage.url||""} onChange={(e)=>patch("openGraph",{...(seo.openGraph||{}),image:e.target.value})} placeholder="OG Image URL" className="field"/><input value={seo.twitter?.title||""} onChange={(e)=>patch("twitter",{...(seo.twitter||{}),title:e.target.value})} placeholder="Twitter Title" className="field"/><textarea value={seo.twitter?.description||""} onChange={(e)=>patch("twitter",{...(seo.twitter||{}),description:e.target.value})} placeholder="Twitter Description" className="textarea" rows={2}/></div></details></div>;
}

function BlogPreview({ title, excerpt, featuredImage, blocks, customCss }: { title:string; excerpt:string; featuredImage:BlogImage; blocks:BlogBlock[]; customCss:string }) {
  return <article className="blog-content mx-auto max-w-[1000px] rounded-[24px] border border-[#211A18]/10 bg-white p-6 md:p-10">{customCss && <style>{customCss}</style>}<header><h1 className="text-3xl font-semibold leading-tight md:text-5xl">{title||"Untitled Blog"}</h1>{excerpt && <p className="mt-4 text-base leading-7 text-[#211A18]/60">{excerpt}</p>}</header>{featuredImage.url && <img src={featuredImage.url} alt={featuredImage.alt||title} className="mt-8 w-full rounded-2xl"/>}<div className="mt-8 space-y-5">{blocks.map((block)=><BlockPreview key={block.id} block={block}/>)}</div></article>;
}

function BlockPreview({ block }: { block:BlogBlock }) {
  const d=block.data||{}; const s=block.style||{}; const style:any={color:s.color||undefined,backgroundColor:s.backgroundColor||undefined,fontSize:s.fontSize||undefined,fontWeight:s.fontWeight||undefined,textAlign:s.textAlign||undefined,lineHeight:s.lineHeight||undefined,margin:s.margin||undefined,padding:s.padding||undefined,borderRadius:s.borderRadius||undefined};
  if(block.type==="heading"){const level=Math.max(1,Math.min(6,Number(d.level||2)));const Tag=`h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";return <Tag id={block.anchorId||undefined} className={block.className} style={style} dangerouslySetInnerHTML={{__html:d.text||""}}/>;}
  if(block.type==="paragraph"||block.type==="callout")return <div id={block.anchorId||undefined} className={block.className} style={style} dangerouslySetInnerHTML={{__html:d.text||""}}/>;
  if(block.type==="quote")return <blockquote style={style} className="border-l-4 border-[#8C1839] pl-4 italic" dangerouslySetInnerHTML={{__html:d.text||""}}/>;
  if(block.type==="image")return d.url?<figure style={style}>{d.link?<a href={d.link}><img src={d.url} alt={d.alt||""} className="max-w-full rounded-xl"/></a>:<img src={d.url} alt={d.alt||""} className="max-w-full rounded-xl"/>}{d.caption&&<figcaption className="mt-2 text-xs text-[#211A18]/50">{d.caption}</figcaption>}</figure>:null;
  if(block.type==="list"){const Tag=d.ordered?"ol":"ul";return <Tag style={style} className={d.ordered?"list-decimal pl-6":"list-disc pl-6"}>{(d.items||[]).map((x:any,i:number)=><li key={i}>{x}</li>)}</Tag>}
  if(block.type==="button")return <a href={d.href||"#"} style={style} className="inline-flex rounded-xl bg-[#8C1839] px-5 py-3 text-sm font-semibold text-white">{d.text||"Read More"}</a>;
  if(block.type==="divider")return <hr style={style}/>;
  if(block.type==="spacer")return <div style={{...style,height:Number(d.height||32)}}/>;
  if(block.type==="code")return <pre style={style} className="overflow-auto rounded-xl bg-[#211A18] p-4 text-xs text-white"><code>{d.code}</code></pre>;
  if(block.type==="html")return <div style={style} dangerouslySetInnerHTML={{__html:d.html||""}}/>;
  if(block.type==="video")return d.url?<div style={style} className="aspect-video"><iframe src={d.url} title={d.title||"Video"} className="h-full w-full rounded-xl" allowFullScreen/></div>:null;
  if(block.type==="faq")return <div style={style} className="space-y-2">{(d.items||[]).map((x:any,i:number)=><details key={i} className="rounded-xl border border-[#211A18]/10 p-3"><summary className="font-semibold">{x.question}</summary><div className="mt-2" dangerouslySetInnerHTML={{__html:x.answer||""}}/></details>)}</div>;
  if(block.type==="table")return <div className="overflow-auto"><table style={style} className="w-full border-collapse"> <tbody>{(d.rows||[]).map((r:any[],i:number)=><tr key={i}>{r.map((c:any,j:number)=><td key={j} className="border border-[#211A18]/10 p-2">{c}</td>)}</tr>)}</tbody></table></div>;
  if(block.type==="columns")return <div style={style} className="grid gap-4 md:grid-cols-2">{(d.columns||[]).map((c:any,i:number)=><div key={i} dangerouslySetInnerHTML={{__html:c.html||""}}/>)}</div>;
  return null;
}

function Panel({ title, children }: { title:string; children:React.ReactNode }) { return <section className="rounded-[20px] border border-[#211A18]/10 bg-white p-4"><h3 className="mb-4 text-[11px] font-semibold text-[#211A18]">{title}</h3>{children}</section>; }
function FieldLabel({ children }: { children:React.ReactNode }) { return <span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-[0.08em] text-[#211A18]/40">{children}</span>; }
function StyleInput({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string}){return <label><FieldLabel>{label}</FieldLabel><input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="field"/></label>}
function IconButton({children,onClick,title,disabled,danger}:{children:React.ReactNode;onClick:()=>void;title:string;disabled?:boolean;danger?:boolean}){return <button type="button" title={title} disabled={disabled} onClick={onClick} className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#211A18]/10 ${danger?"text-red-600":"text-[#211A18]/55"} disabled:opacity-30`}>{children}</button>}
function MiniButton({children,onClick}:{children:React.ReactNode;onClick:()=>void}){return <button type="button" onMouseDown={(e)=>e.preventDefault()} onClick={onClick} className="flex h-7 min-w-7 items-center justify-center rounded border border-[#211A18]/10 bg-white px-2 text-[10px] font-semibold">{children}</button>}

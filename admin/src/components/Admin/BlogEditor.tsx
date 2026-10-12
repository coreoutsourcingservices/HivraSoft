"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";
import WordBlogEditor from "@/src/components/Admin/WordBlogEditor";
import {
  createAdminBlog,
  getAdminBlog,
  updateAdminBlog,
  uploadBlogImage,
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

function taxId(value: BlogTaxonomy | string | null | undefined) {
  return typeof value === "string" ? value : value?._id || "";
}

type ProductCategoryOption = {
  id: string;
  name: string;
  slug: string;
  level: number;
};

function flattenProductCategories(nodes: any[], depth = 0): ProductCategoryOption[] {
  return (Array.isArray(nodes) ? nodes : []).flatMap((node: any) => {
    const id = String(node?._id || node?.id || "").trim();
    const name = String(node?.name || "").trim();
    const slug = String(node?.slug || "").trim();
    const level = Number.isFinite(Number(node?.level)) ? Number(node.level) : depth;
    const current = id && name ? [{ id, name, slug, level }] : [];
    return [...current, ...flattenProductCategories(node?.children || [], depth + 1)];
  });
}

function tagName(value: BlogTaxonomy | string | null | undefined) {
  return typeof value === "string" ? value : value?.name || "";
}

function formatDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function stripHtml(value: string) {
  if (typeof window === "undefined") return value.replace(/<[^>]+>/g, " ");
  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent || "";
}

function contentStats(html: string) {
  if (typeof window === "undefined") return { h1: 0, images: 0, missingAlt: 0 };
  const element = document.createElement("div");
  element.innerHTML = html;
  const images = [...element.querySelectorAll("img")];
  return {
    h1: element.querySelectorAll("h1").length,
    images: images.length,
    missingAlt: images.filter((image) => !String(image.getAttribute("alt") || "").trim()).length,
  };
}

export default function BlogEditor({ blogId }: { blogId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState<BlogImage>(emptyImage);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
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
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [dirty, setDirty] = useState(false);

  const localKey = `hivrasoft-blog-document:${blogId || "new"}`;
  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    if (!blogId) {
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft?.title || draft?.content) {
            setTitle(draft.title || "");
            setSlug(draft.slug || "");
            setSlugEdited(Boolean(draft.slug));
            setExcerpt(draft.excerpt || "");
            setContent(draft.content || "");
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
        setContent(blog.content || "");
        setFeaturedImage(blog.featuredImage || emptyImage);
        setCategory(taxId(blog.category));
        setTags((blog.tags || []).map(tagName).map((value) => value.trim()).filter(Boolean));
        setStatus(blog.status || "DRAFT");
        setScheduledAt(formatDateInput(blog.scheduledAt));
        setIsFeatured(Boolean(blog.isFeatured));
        setSeo(blog.seo || {});
        setCustomCss(blog.customCss || "");
        setDirty(false);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load blog."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title));
  }, [slugEdited, title]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!dirty || (!title.trim() && !stripHtml(content).trim())) return;
      try {
        localStorage.setItem(localKey, JSON.stringify({ title, slug, excerpt, content, featuredImage, category, tags, seo, isFeatured, customCss, savedAt: new Date().toISOString() }));
        setMessage("Draft autosaved locally.");
      } catch { /* storage can be unavailable */ }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [category, content, customCss, dirty, excerpt, featuredImage, isFeatured, localKey, seo, slug, tags, title]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const payload = useCallback((statusOverride?: typeof status) => ({
    title,
    slug,
    excerpt,
    content,
    blocks: [],
    featuredImage,
    category: category || null,
    tags,
    status: statusOverride || status,
    scheduledAt: (statusOverride || status) === "SCHEDULED" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    isFeatured,
    customCss,
    seo,
  }), [category, content, customCss, excerpt, featuredImage, isFeatured, scheduledAt, seo, slug, status, tags, title]);

  function addTags(rawValue: string) {
    const incoming = rawValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!incoming.length) return;

    setTags((current) => {
      const byName = new Map(current.map((value) => [value.toLowerCase(), value]));
      incoming.forEach((value) => {
        if (!byName.has(value.toLowerCase())) byName.set(value.toLowerCase(), value);
      });
      return [...byName.values()];
    });
    markDirty();
  }

  function removeTag(tag: string) {
    setTags((current) => current.filter((value) => value.toLowerCase() !== tag.toLowerCase()));
    markDirty();
  }

  async function save(statusOverride?: typeof status) {
    const nextStatus = statusOverride || status;
    if (!title.trim()) { setError("Blog title is required."); return; }
    if (!slug.trim()) { setError("Blog slug is required."); return; }
    if (nextStatus === "SCHEDULED" && !scheduledAt) { setError("Choose a scheduled publish date/time."); return; }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const result = blogId ? await updateAdminBlog(blogId, payload(statusOverride)) : await createAdminBlog(payload(statusOverride));
      setStatus(result.blog.status);
      setContent(result.blog.content || content);
      setDirty(false);
      localStorage.removeItem(localKey);
      setMessage(nextStatus === "PUBLISHED" ? "Blog published successfully." : "Blog saved successfully.");
      router.replace("/admin/blog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save blog.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadEditorImage(file: File) {
    setError("");
    try {
      const image = await uploadBlogImage(file, `${slug || "blog"}-${Date.now()}`);
      return { url: image.url, publicId: image.publicId, width: image.width, height: image.height, alt: image.alt || image.name || title, title: image.name || "", caption: "" } satisfies BlogImage;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image upload failed.";
      setError(message);
      throw err;
    }
  }

  async function uploadFeatured(file: File) {
    try {
      setUploadingFeatured(true);
      setError("");
      const image = await uploadBlogImage(file, `${slug || "blog"}-featured`);
      setFeaturedImage({ url: image.url, publicId: image.publicId, width: image.width, height: image.height, alt: image.alt || image.name || title, title: image.name || "", caption: "" });
      markDirty();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Featured image upload failed.");
    } finally {
      setUploadingFeatured(false);
    }
  }

  const plainText = useMemo(() => stripHtml(content), [content]);
  const seoChecks = useMemo(() => {
    const focus = String(seo.focusKeyword || "").trim().toLowerCase();
    const meta = String(seo.metaDescription || "");
    const stats = contentStats(content);
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    return [
      { label: "Focus keyword in title", ok: !focus || title.toLowerCase().includes(focus) },
      { label: "Focus keyword in slug", ok: !focus || slug.toLowerCase().includes(slugify(focus)) },
      { label: "Focus keyword in meta description", ok: !focus || meta.toLowerCase().includes(focus) },
      { label: "Single main H1", ok: stats.h1 === 0, note: stats.h1 ? "Blog title already supplies the H1; use H2/H3 in the document." : "Blog title supplies the H1." },
      { label: "Images have ALT text", ok: stats.missingAlt === 0, note: stats.images ? `${stats.images} editor image(s)` : "No editor images." },
      { label: "SEO title length", ok: String(seo.metaTitle || title).length >= 40 && String(seo.metaTitle || title).length <= 65 },
      { label: "Meta description length", ok: meta.length >= 120 && meta.length <= 170 },
      { label: `Word count: ${wordCount}`, ok: wordCount >= 300 },
    ];
  }, [content, plainText, seo.focusKeyword, seo.metaDescription, seo.metaTitle, slug, title]);

  if (loading) return <div className="rounded-2xl border border-[#211A18]/10 bg-white p-16 text-center text-xs text-[#211A18]/45"><Loader2 className="mx-auto mb-3 animate-spin" />Loading blog editor...</div>;

  return (
    <section className="mx-auto w-full max-w-[1700px]">
      <div className="mb-5 flex flex-col gap-3 rounded-[22px] border border-[#211A18]/10 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8C1839]">Blog Document Editor</p>
          <h2 className="mt-1 text-xl font-semibold text-[#211A18]">{blogId ? "Edit Blog" : "Add New Blog"}</h2>
          <p className="mt-1 text-[10px] text-[#211A18]/45">One Word-style document editor for creating, saving and publishing website blogs.</p>
          <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold ${dirty ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{dirty ? "Unsaved Changes" : "Saved"}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowPreview((value) => !value)} className="h-10 rounded-xl border border-[#211A18]/10 bg-white px-4 text-[10px] font-semibold">{showPreview ? "Back to Editor" : "Preview"}</button>
          <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#A51D45] px-4 text-[10px] font-semibold text-white disabled:opacity-50">{saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}{blogId ? "Update" : "Save"}</button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
      {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{message}</div>}

      {showPreview ? (
        <BlogPreview title={title} excerpt={excerpt} featuredImage={featuredImage} content={content} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="rounded-[22px] border border-[#211A18]/10 bg-white p-5">
              <label className="block"><FieldLabel>Blog Title</FieldLabel><input value={title} onChange={(event) => { setTitle(event.target.value); markDirty(); }} placeholder="Enter blog title" className="h-14 w-full rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-lg font-semibold outline-none focus:border-[#8C1839]/40" /></label>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label><FieldLabel>Slug</FieldLabel><input value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); markDirty(); }} className="field" /></label>
                <label><FieldLabel>Excerpt</FieldLabel><input value={excerpt} onChange={(event) => { setExcerpt(event.target.value); markDirty(); }} placeholder="Short blog summary" className="field" /></label>
              </div>
            </div>

            <WordBlogEditor
              value={content}
              onChange={(html) => { setContent(html); markDirty(); }}
              onImageUpload={uploadEditorImage}
              disabled={saving}
            />
          </div>

          <aside className="space-y-5 xl:sticky xl:top-[96px] xl:self-start">
            <Panel title="Publish">
              <label className="block"><FieldLabel>Status</FieldLabel><select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); markDirty(); }} className="field"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="SCHEDULED">Scheduled</option><option value="PRIVATE">Private</option></select></label>
              {status === "SCHEDULED" && <label className="mt-3 block"><FieldLabel>Publish At</FieldLabel><input type="datetime-local" value={scheduledAt} onChange={(event) => { setScheduledAt(event.target.value); markDirty(); }} className="field" /></label>}
              <label className="mt-3 flex items-center gap-2 text-[10px] font-semibold"><input type="checkbox" checked={isFeatured} onChange={(event) => { setIsFeatured(event.target.checked); markDirty(); }} className="accent-[#8C1839]" />Featured Blog</label>
            </Panel>

            <Panel title="Featured Image">
              {featuredImage.url ? <img src={featuredImage.url} alt={featuredImage.alt || title} className="mb-3 aspect-video w-full rounded-xl object-cover" /> : <div className="mb-3 flex aspect-video items-center justify-center rounded-xl bg-[#FAF8F6] text-[10px] text-[#211A18]/35">No featured image</div>}
              <label className="block cursor-pointer rounded-xl border border-dashed border-[#8C1839]/30 p-3 text-center text-[10px] font-semibold text-[#8C1839]">{uploadingFeatured ? "Uploading..." : "Upload / Replace Image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFeatured(file); }} /></label>
              {featuredImage.url && <><input value={featuredImage.alt || ""} onChange={(event) => { setFeaturedImage((value) => ({ ...value, alt: event.target.value })); markDirty(); }} placeholder="ALT text" className="field mt-3" /><button type="button" onClick={() => { setFeaturedImage(emptyImage); markDirty(); }} className="mt-2 text-[9px] font-semibold text-red-600">Remove image</button></>}
            </Panel>

            <Panel title="Tags">
              <div className="mt-3">
                <FieldLabel>Tags</FieldLabel>
                <div className="rounded-xl border border-[#211A18]/10 bg-white p-2.5 focus-within:border-[#8C1839]/35">
                  {tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag.toLowerCase()} className="inline-flex items-center gap-1.5 rounded-full bg-[#F7EEF1] px-2.5 py-1 text-[9px] font-semibold text-[#8C1839]">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#8C1839]/10">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    value={tagInput}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value.includes(",")) {
                        const parts = value.split(",");
                        addTags(parts.slice(0, -1).join(","));
                        setTagInput(parts[parts.length - 1] || "");
                      } else {
                        setTagInput(value);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTags(tagInput);
                        setTagInput("");
                      } else if (event.key === "Backspace" && !tagInput && tags.length) {
                        removeTag(tags[tags.length - 1]);
                      }
                    }}
                    onBlur={() => { if (tagInput.trim()) { addTags(tagInput); setTagInput(""); } }}
                    placeholder="Tag likho, comma (,) se add hoga"
                    className="h-8 w-full bg-transparent px-1 text-[10px] outline-none placeholder:text-[#211A18]/30"
                  />
                </div>
                <p className="mt-1.5 text-[8px] text-[#211A18]/35">Comma ya Enter dabao. Tag hatane ke liye × par click karo.</p>
              </div>
            </Panel>

            <Panel title="SEO">
              <SeoFields seo={seo} setSeo={(next: any) => { setSeo(next); markDirty(); }} title={title} featuredImage={featuredImage} />
              <div className="mt-4 space-y-2">{seoChecks.map((check) => <div key={check.label} className="flex items-start justify-between gap-3 rounded-lg bg-[#FAF8F6] px-3 py-2 text-[9px]"><div><div>{check.label}</div>{check.note && <div className="mt-1 text-[#211A18]/40">{check.note}</div>}</div><span className={`shrink-0 font-semibold ${check.ok ? "text-emerald-600" : "text-amber-600"}`}>{check.ok ? "Good" : "Needs Improvement"}</span></div>)}</div>
            </Panel>

          </aside>
        </div>
      )}
    </section>
  );
}

function SeoFields({ seo, setSeo, title, featuredImage }: { seo: any; setSeo: (value: any) => void; title: string; featuredImage: BlogImage }) {
  const patch = (key: string, value: any) => setSeo({ ...seo, [key]: value });
  return <div className="space-y-3"><label><FieldLabel>SEO Title ({String(seo.metaTitle || title).length}/60)</FieldLabel><input value={seo.metaTitle || ""} onChange={(event) => patch("metaTitle", event.target.value)} placeholder={title || "SEO title"} className="field" /></label><label><FieldLabel>Meta Description ({String(seo.metaDescription || "").length}/160)</FieldLabel><textarea value={seo.metaDescription || ""} onChange={(event) => patch("metaDescription", event.target.value)} rows={4} className="textarea" /></label><label><FieldLabel>Focus Keyword</FieldLabel><input value={seo.focusKeyword || ""} onChange={(event) => patch("focusKeyword", event.target.value)} className="field" /></label><label><FieldLabel>Keywords (comma separated)</FieldLabel><input value={(seo.keywords || []).join(", ")} onChange={(event) => patch("keywords", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} className="field" /></label><label><FieldLabel>Canonical URL</FieldLabel><input value={seo.canonicalUrl || ""} onChange={(event) => patch("canonicalUrl", event.target.value)} className="field" /></label><div className="flex gap-4 text-[9px] font-semibold"><label className="flex items-center gap-2"><input type="checkbox" checked={seo.robots?.index !== false} onChange={(event) => patch("robots", { ...(seo.robots || {}), index: event.target.checked })} className="accent-[#8C1839]" />Index</label><label className="flex items-center gap-2"><input type="checkbox" checked={seo.robots?.follow !== false} onChange={(event) => patch("robots", { ...(seo.robots || {}), follow: event.target.checked })} className="accent-[#8C1839]" />Follow</label></div><details className="rounded-xl bg-[#FAF8F6] p-3"><summary className="cursor-pointer text-[9px] font-semibold">Open Graph / Twitter</summary><div className="mt-3 space-y-2"><input value={seo.openGraph?.title || ""} onChange={(event) => patch("openGraph", { ...(seo.openGraph || {}), title: event.target.value })} placeholder="OG Title" className="field" /><textarea value={seo.openGraph?.description || ""} onChange={(event) => patch("openGraph", { ...(seo.openGraph || {}), description: event.target.value })} placeholder="OG Description" className="textarea" rows={2} /><input value={seo.openGraph?.image || featuredImage.url || ""} onChange={(event) => patch("openGraph", { ...(seo.openGraph || {}), image: event.target.value })} placeholder="OG Image URL" className="field" /><input value={seo.twitter?.title || ""} onChange={(event) => patch("twitter", { ...(seo.twitter || {}), title: event.target.value })} placeholder="Twitter Title" className="field" /><textarea value={seo.twitter?.description || ""} onChange={(event) => patch("twitter", { ...(seo.twitter || {}), description: event.target.value })} placeholder="Twitter Description" className="textarea" rows={2} /></div></details></div>;
}

function BlogPreview({ title, excerpt, featuredImage, content }: { title: string; excerpt: string; featuredImage: BlogImage; content: string }) {
  return <article className="blog-content mx-auto max-w-[1000px] rounded-[24px] border border-[#211A18]/10 bg-white p-6 md:p-10"><header><h1 className="text-3xl font-semibold leading-tight md:text-5xl">{title || "Untitled Blog"}</h1>{excerpt && <p className="mt-4 text-base leading-7 text-[#211A18]/60">{excerpt}</p>}</header>{featuredImage.url && <img src={featuredImage.url} alt={featuredImage.alt || title} className="mt-8 w-full rounded-2xl" />}<iframe title="Blog content preview" sandbox="" srcDoc={content} className="mt-8 h-[900px] w-full rounded-xl border border-[#211A18]/10 bg-white" /></article>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-[20px] border border-[#211A18]/10 bg-white p-4"><h3 className="mb-4 text-[11px] font-semibold text-[#211A18]">{title}</h3>{children}</section>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-[0.08em] text-[#211A18]/40">{children}</span>;
}

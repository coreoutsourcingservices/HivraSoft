"use client";
import { useState } from "react";

export default function BlogShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window === "undefined" ? "" : window.location.href;
  const encUrl = encodeURIComponent(currentUrl); const encTitle = encodeURIComponent(title);
  const links = [
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`],
    ["X", `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`],
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`],
    ["WhatsApp", `https://wa.me/?text=${encTitle}%20${encUrl}`],
  ];
  return <div className="flex flex-wrap gap-2">{links.map(([label,href])=><a key={label} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#211A18]/10 px-3 py-2 text-[10px] font-semibold text-[#211A18]/60 hover:border-[#A51D45] hover:text-[#A51D45]">{label}</a>)}<button onClick={async()=>{try{await navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),1500);}catch{}}} className="rounded-full border border-[#211A18]/10 px-3 py-2 text-[10px] font-semibold text-[#211A18]/60 hover:border-[#A51D45] hover:text-[#A51D45]">{copied?"Copied":"Copy Link"}</button></div>;
}

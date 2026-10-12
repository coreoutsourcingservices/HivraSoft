import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getOfferBySlug } from "@/src/services/offers";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import JsonLd from "@/src/components/Seo/JsonLd";
import { cache } from "react";
const getOffer=cache(getOfferBySlug);
type Props={children:ReactNode;params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){
  const {slug}=await params;const offer=await getOffer(slug);if(!offer)notFound();
  return pageMetadata({path:`/offers/${encodeURIComponent(slug)}`,title:`${offer.name} - Innerwear Offers`,description:`Explore ${offer.name} at HivraSoft. Browse eligible products, available colours and sizes, and check the offer details before shopping for everyday essentials.`,image:offer.image?.url});
}
export default async function Layout({children,params}:Props){
  const {slug}=await params;const offer=await getOffer(slug);if(!offer)notFound();
  return <><h1 className="sr-only">{offer.name}</h1><JsonLd data={breadcrumbSchema([{name:"Home",path:"/"},{name:offer.name,path:`/offers/${encodeURIComponent(slug)}`}])}/>{children}</>;
}

import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata({path:"/account/checkout",title:"checkout",noindex:true});
export default function Layout({children}:{children:ReactNode}){return children;}

"use client";
import { useEffect, useRef } from "react";
import Header from "@/src/components/Header/Header";
const API_URL=(process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000").replace(/\/$/,"");
export default function Page(){
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{let observer:ResizeObserver|undefined;const iframe=frame.current;
  const update=()=>{try{const height=iframe?.contentDocument?.documentElement.scrollHeight||0;if(iframe&&height)iframe.style.height=`${height+20}px`;}catch{}};
  const onLoad=()=>{update();try{if(iframe?.contentDocument){observer=new ResizeObserver(update);observer.observe(iframe.contentDocument.body);}}catch{}};
  iframe?.addEventListener("load",onLoad);return()=>{iframe?.removeEventListener("load",onLoad);observer?.disconnect();};
 },[]);
 return <><Header/><main style={{width:"100%",background:"#fff"}}><iframe ref={frame} title="Send Your Bra" src={`/campaigns/send-your-bra.html?api=${encodeURIComponent(API_URL)}`} style={{width:"100%",height:"6500px",border:0,display:"block"}} scrolling="no"/></main></>;
}

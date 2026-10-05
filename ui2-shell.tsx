"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";

export default function ProductShell({children}:{children:React.ReactNode}){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const [mode,setMode]=useState<"Chatbot"|"Voice Bot">("Chatbot");
  const active=(href:string)=>href==="/"?pathname==="/":pathname.startsWith(href);
  return <div className="bn-app">
    <aside className="bn-side">
      <Link href="/" className="bn-brand"><span className="bn-logo">B</span><span><b>BOTNOI Builder</b><small>Agent workspace</small></span></Link>
      <nav>
        <Link className={active("/")?"active":""} href="/">⌂ <span>Home</span></Link>
        <Link className={active("/projects")?"active":""} href="/projects">▦ <span>Project</span></Link>
        <Link className={active("/knowledge")?"active":""} href="/knowledge">◇ <span>Knowledge</span></Link>
      </nav>
      <div className="bn-side-foot"><small>Workflow</small><b>Describe → Build → Test</b></div>
    </aside>
    <main className="bn-main">{children}</main>
    <div className="bn-widget-wrap">
      {open&&<div className="bn-widget-panel">
        <div className="bn-widget-head"><b>Bot Preview</b><button onClick={()=>setOpen(false)}>×</button></div>
        <div className="bn-segment"><button className={mode==="Chatbot"?"active":""} onClick={()=>setMode("Chatbot")}>Chatbot</button><button className={mode==="Voice Bot"?"active":""} onClick={()=>setMode("Voice Bot")}>Voice Bot</button></div>
        <div className="bn-widget-empty"><span>{mode==="Chatbot"?"💬":"🎙️"}</span><b>{mode}</b><small>Plug in your bot endpoint here for live preview.</small></div>
      </div>}
      <button className="bn-widget-btn" onClick={()=>setOpen(v=>!v)}>{open?"×":"✦"}</button>
    </div>
  </div>
}

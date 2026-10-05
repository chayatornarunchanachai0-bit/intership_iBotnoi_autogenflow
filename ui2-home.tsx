"use client";
import Link from "next/link";
const recent=[
  {name:"Airline Assistant",type:"Voicebot",status:"Design",updated:"Today"},
  {name:"Debt Collection",type:"Voicebot",status:"Testing",updated:"Yesterday"},
  {name:"Insurance FAQ",type:"Chatbot",status:"Ready",updated:"3 days ago"},
];
export default function HomePage(){return <div className="bn-page">
  <section className="bn-hero">
    <div><span className="bn-kicker">AGENT WORKSPACE</span><h1>Build chatbot & voicebot faster.</h1><p>Turn a short description into a flow, production-ready prompt and test cases in one workspace.</p><div className="bn-actions"><Link className="bn-primary" href="/projects">+ Create Project</Link><Link className="bn-secondary" href="/knowledge">Browse Knowledge</Link></div></div>
    <div className="bn-flow-card"><small>WORKFLOW</small><div><span>1</span><b>Description</b></div><i>→</i><div><span>2</span><b>Flow + Prompt</b></div><i>→</i><div><span>3</span><b>Test</b></div></div>
  </section>
  <section className="bn-metrics"><div><small>Projects</small><strong>12</strong><span>+3 this month</span></div><div><small>In progress</small><strong>5</strong><span>Design & testing</span></div><div><small>Test pass rate</small><strong>92%</strong><span>Last 30 days</span></div><div><small>Ready</small><strong>7</strong><span>Production-ready</span></div></section>
  <section className="bn-section"><div className="bn-section-head"><div><span className="bn-kicker">RECENT</span><h2>Recent projects</h2></div><Link href="/projects">View all →</Link></div><div className="bn-table-card"><div className="bn-table-row bn-table-head"><span>Project</span><span>Type</span><span>Status</span><span>Updated</span><span></span></div>{recent.map((p,i)=><Link key={i} href="/projects" className="bn-table-row"><span><b>{p.name}</b><small>Agent project</small></span><span>{p.type}</span><span><em className={`bn-status ${p.status.toLowerCase()}`}>{p.status}</em></span><span>{p.updated}</span><span>→</span></Link>)}</div></section>
</div>}

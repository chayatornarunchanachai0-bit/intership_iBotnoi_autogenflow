"use client";
import {useMemo,useState} from "react";
import Link from "next/link";

type TC={id:string,title:string,type:string,input:string,expected:string,status:"PASS"|"FAIL"|"NOT RUN"};
const seed:TC[]=[
 {id:"TC-001",title:"Greeting and request identification",type:"Normal",input:"สวัสดี ต้องการสอบถามข้อมูล",expected:"Greets and asks what the customer needs",status:"PASS"},
 {id:"TC-002",title:"Known FAQ",type:"Normal",input:"เปิดให้บริการกี่โมง",expected:"Answers supported FAQ concisely",status:"PASS"},
 {id:"TC-003",title:"Missing required information",type:"Validation",input:"ช่วยเช็กสถานะให้หน่อย",expected:"Asks for only the required missing detail",status:"FAIL"},
 {id:"TC-004",title:"Unsupported topic",type:"Fallback",input:"ช่วยแนะนำหุ้นหน่อย",expected:"Does not hallucinate and redirects safely",status:"PASS"},
 {id:"TC-005",title:"Customer requests human agent",type:"Escalation",input:"ขอคุยกับเจ้าหน้าที่",expected:"Transfers to agent according to flow",status:"NOT RUN"},
];
export default function TestCases(){
 const [rows,setRows]=useState<TC[]>(seed);const [filter,setFilter]=useState("ALL");
 const stats=useMemo(()=>({total:rows.length,pass:rows.filter(x=>x.status==="PASS").length,fail:rows.filter(x=>x.status==="FAIL").length,notrun:rows.filter(x=>x.status==="NOT RUN").length}),[rows]);
 const visible=filter==="ALL"?rows:rows.filter(x=>x.status===filter);
 const generate=()=>{const n=rows.length+1;setRows(r=>[...r,{id:`TC-${String(n).padStart(3,"0")}`,title:"Generated edge case",type:"Edge",input:"Ambiguous customer response",expected:"Clarifies without leaving the designed flow",status:"NOT RUN"}])};
 const cycle=(id:string)=>setRows(r=>r.map(x=>x.id===id?{...x,status:x.status==="NOT RUN"?"PASS":x.status==="PASS"?"FAIL":"NOT RUN"}:x));
 return <div className="bn-page">
  <div className="bn-project-top"><div><Link className="bn-back" href="/projects/1">← Design workspace</Link><span className="bn-kicker">PROJECT WORKSPACE</span><h1>Test Case</h1><p>Generate scenarios from the design, run them and review the result summary.</p></div><button className="bn-primary-btn" onClick={generate}>✦ Generate Test Cases</button></div>
  <div className="bn-stepper"><div className="done"><span>1</span><b>Description</b><small>Complete</small></div><i>→</i><Link className="done" href="/projects/1"><span>2</span><b>Design</b><small>Flow + Prompt</small></Link><i>→</i><div className="active"><span>3</span><b>Test Case</b><small>Generate & validate</small></div><i>→</i><div><span>4</span><b>Ready</b><small>Review & publish</small></div></div>
  <section className="bn-test-summary"><div><small>Total</small><strong>{stats.total}</strong></div><div><small>Pass</small><strong>{stats.pass}</strong><span>{stats.total?Math.round(stats.pass/stats.total*100):0}%</span></div><div><small>Fail</small><strong>{stats.fail}</strong></div><div><small>Not Run</small><strong>{stats.notrun}</strong></div></section>
  <section className="bn-section"><div className="bn-section-head"><div><span className="bn-kicker">VALIDATION</span><h2>Generated test cases</h2></div><div className="bn-filter-tabs">{["ALL","PASS","FAIL","NOT RUN"].map(x=><button key={x} onClick={()=>setFilter(x)} className={filter===x?"active":""}>{x}</button>)}</div></div>
   <div className="bn-test-table"><div className="bn-test-row bn-test-head"><span>ID</span><span>Test case</span><span>Type</span><span>Expected result</span><span>Status</span></div>{visible.map(tc=><button key={tc.id} className="bn-test-row" onClick={()=>cycle(tc.id)}><span>{tc.id}</span><span><b>{tc.title}</b><small>{tc.input}</small></span><span>{tc.type}</span><span>{tc.expected}</span><span><em className={`bn-result ${tc.status.replace(" ","-").toLowerCase()}`}>{tc.status}</em></span></button>)}</div>
   <div className="bn-table-help">Click a row to cycle its result between Not Run, Pass and Fail for this prototype.</div>
  </section>
  <div className="bn-next-card"><div><span>Quality gate</span><b>{stats.fail===0&&stats.notrun===0?"All tests passed. This project is ready for review.":`${stats.fail} failed and ${stats.notrun} not run — resolve them before Ready.`}</b></div><button className="bn-primary-btn" disabled={stats.fail>0||stats.notrun>0}>Mark as Ready →</button></div>
 </div>
}

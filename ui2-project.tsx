"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";

type Version={id:number,label:string,prompt:string,created:string};
const initial=`# ROLE\nYou are a helpful BOTNOI assistant.\n\n# INTENT\nUnderstand the user's request and follow the designed conversation flow.\n\n# IMPORTANT\nAnswer concisely, validate required data and never invent missing information.`;

export default function ProjectWorkspace(){
 const params=useParams<{id:string}>(); const projectId=params?.id||"1";
 const [description,setDescription]=useState("Create a customer service assistant that greets the customer, identifies the request, answers FAQ, collects required details and transfers to an agent when needed.");
 const [prompt,setPrompt]=useState(initial);
 const [versions,setVersions]=useState<Version[]>([{id:1,label:"v1",prompt:initial,created:"Initial"}]);
 const [active,setActive]=useState(1);
 const nodes=useMemo(()=>[["Start","Greeting"],["Identify request","Intent detection"],["FAQ","Answer known topics"],["Collect info","Required details"],["Escalate","Agent transfer"],["End","Complete"]],[]);
 const generate=()=>{setPrompt(`# ROLE\nYou are a BOTNOI customer service assistant.\n\n# GOAL\n${description}\n\n# FLOW\n1. Greet the customer.\n2. Identify the request.\n3. Answer supported FAQ.\n4. Collect only required information.\n5. Transfer to an agent when necessary.\n\n# IMPORTANT\n- Keep replies concise.\n- Never invent customer data.\n- Ask one question at a time.\n- Follow the conversation flow.`)};
 const saveVersion=()=>{const id=versions.length+1;setVersions(v=>[...v,{id,label:`v${id}`,prompt,created:"Just now"}]);setActive(id)};
 return <div className="bn-page">
  <div className="bn-project-top"><div><Link className="bn-back" href="/projects">← Projects</Link><span className="bn-kicker">PROJECT WORKSPACE</span><h1>Customer Service Agent</h1><p>Design the agent, refine the prompt and continue to testing.</p></div><div className="bn-project-actions"><button className="bn-secondary-btn">Share</button><button className="bn-primary-btn" onClick={saveVersion}>Save version</button></div></div>
  <div className="bn-stepper"><div className="done"><span>1</span><b>Description</b><small>Define the use case</small></div><i>→</i><div className="active"><span>2</span><b>Design</b><small>Flow + Prompt</small></div><i>→</i><Link href={`/projects/${projectId}/test-cases`}><span>3</span><b>Test Case</b><small>Generate & validate</small></Link><i>→</i><div><span>4</span><b>Ready</b><small>Review & publish</small></div></div>
  <section className="bn-description-card"><div className="bn-card-title"><div><span className="bn-num">01</span><div><h2>Description</h2><p>Describe what this agent should do. Keep it natural — the builder will structure it.</p></div></div><span className="bn-pill">Required</span></div><textarea value={description} onChange={e=>setDescription(e.target.value)} /><div className="bn-desc-foot"><small>{description.length} characters</small><button className="bn-primary-btn" onClick={generate}>✦ Generate Flow & Prompt</button></div></section>
  <div className="bn-design-grid">
   <section className="bn-panel"><div className="bn-card-title"><div><span className="bn-num">02</span><div><h2>Flow Diagram</h2><p>Conversation journey generated from the description.</p></div></div><button className="bn-icon-btn">↗</button></div><div className="bn-flow-canvas">{nodes.map((n,i)=><div key={i} className="bn-node-wrap"><div className={`bn-node ${i===0?"start":i===nodes.length-1?"end":""}`}><small>{n[1]}</small><b>{n[0]}</b></div>{i<nodes.length-1&&<span className="bn-node-arrow">↓</span>}</div>)}</div><div className="bn-panel-foot"><button className="bn-secondary-btn">+ Add node</button><button className="bn-secondary-btn">Edit flow</button></div></section>
   <section className="bn-panel"><div className="bn-card-title"><div><span className="bn-num">03</span><div><h2>Prompt Builder</h2><p>Edit the generated prompt and save versions as you iterate.</p></div></div><span className="bn-pill green">Live</span></div><div className="bn-version-tabs">{versions.map(v=><button onClick={()=>{setActive(v.id);setPrompt(v.prompt)}} className={active===v.id?"active":""} key={v.id}>{v.label}<small>{v.created}</small></button>)}<button className="add" onClick={saveVersion}>＋</button></div><textarea className="bn-code" value={prompt} onChange={e=>setPrompt(e.target.value)} /><div className="bn-prompt-foot"><span><b>{prompt.length}</b> chars</span><button className="bn-secondary-btn" onClick={()=>navigator.clipboard?.writeText(prompt)}>Copy</button><button className="bn-primary-btn" onClick={saveVersion}>Save as new version</button></div></section>
  </div>
  <div className="bn-next-card"><div><span>Next step</span><b>Validate the design with generated test cases.</b></div><Link className="bn-primary" href={`/projects/${projectId}/test-cases`}>Continue to Test Case →</Link></div>
 </div>
}

'use client';

import { useState } from 'react';
import type { GenerateResult } from '@/lib/types';

interface OutputBlockProps {
  title: string;
  content: string;
  filename: string;
  note?: string;
  rows?: number;
}

function downloadFile(content: string, filename: string) {
  const isJson = filename.endsWith('.json');
  const blob = new Blob([content], {
    type: isJson ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function OutputBlock({ title, content, filename, note, rows = 18 }: OutputBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors (e.g. unsupported browser/permissions)
    }
  }

  return (
    <div className="output-block">
      <div className="output-header">
        <h3>{title}</h3>
        <div className="output-actions">
          <button onClick={handleCopy}>{copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}</button>
          <button onClick={() => downloadFile(content, filename)}>
            {filename.endsWith('.json') ? 'ดาวน์โหลด .json' : 'ดาวน์โหลด .txt'}
          </button>
        </div>
      </div>
      {note && <p className="hint">{note}</p>}
      <textarea readOnly value={content} rows={rows} />
    </div>
  );
}

// ดึงเฉพาะข้อความคำตอบจาก JSON example_answers ({ steps: [{ step, text }] })
function parseExampleTexts(content: string): string[] | null {
  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data?.steps)) return null;
    const texts = data.steps
      .map((s: { text?: unknown }) => (typeof s?.text === 'string' ? s.text : null))
      .filter((t: string | null): t is string => t !== null && t.trim() !== '');
    return texts.length ? texts : null;
  } catch {
    return null;
  }
}

interface ExampleAnswersBlockProps {
  title: string;
  content: string;
  filename: string;
  note?: string;
}

function ExampleAnswersBlock({ title, content, filename, note }: ExampleAnswersBlockProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const texts = parseExampleTexts(content);

  // ถ้า parse JSON ไม่ได้ ให้แสดงแบบ textarea เดิม เพื่อให้ผู้ใช้เห็นและแก้เองได้
  if (!texts) {
    return <OutputBlock title={title} content={content} filename={filename} note={note} rows={12} />;
  }

  async function handleCopyItem(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // ignore clipboard errors (e.g. unsupported browser/permissions)
    }
  }

  return (
    <div className="output-block">
      <div className="output-header">
        <h3>{title}</h3>
        <div className="output-actions">
          <button onClick={() => downloadFile(content, filename)}>ดาวน์โหลด .json</button>
        </div>
      </div>
      {note && <p className="hint">{note}</p>}
      <ol className="answer-list">
        {texts.map((text, index) => (
          <li key={index} className="answer-item">
            <span className="answer-num">{index + 1}.</span>
            <span className="answer-text">{text}</span>
            <button onClick={() => handleCopyItem(index, text)}>
              {copiedIndex === index ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface OutputPanelProps {
  result: GenerateResult;
  botName: string;
}

export default function OutputPanel({ result, botName }: OutputPanelProps) {
  const safeName = (botName || 'bot').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');

  return (
    <section className="card">
      <h2>ผลลัพธ์</h2>
      <OutputBlock title="GetInfo Prompt" content={result.getinfo} filename={`${safeName}_getinfo.txt`} />
      <OutputBlock title="Summary Prompt" content={result.summary} filename={`${safeName}_summary.txt`} />
      <OutputBlock
        title="Check Parameter Template"
        content={result.check_parameter}
        filename={`${safeName}_check_parameter.txt`}
      />
      <ExampleAnswersBlock
        title="ตัวอย่างคำตอบ (Chat Step Automate)"
        content={result.example_answers}
        filename={`${safeName}_chat_step_automate.json`}
        note="ตัวอย่างคำตอบของลูกค้าสำหรับใช้กับ Chat Step Automate — กดคัดลอกรายข้อเพื่อนำไปวางได้เลย หรือดาวน์โหลดทั้งชุดเป็นไฟล์ .json"
      />
    </section>
  );
}

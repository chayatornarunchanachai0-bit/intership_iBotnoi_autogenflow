'use client';

import { useState } from 'react';
import type { GenerateResult, GeneratePart } from '@/lib/types';

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

interface MissingPartBlockProps {
  title: string;
  part: GeneratePart;
  loading: boolean;
  error: string | null;
  onGenerate: (part: GeneratePart) => void;
}

// กล่องแสดงแทนส่วนที่ผู้ใช้เลือกไม่สร้างไว้ พร้อมปุ่มสั่งสร้างเพิ่มภายหลัง
function MissingPartBlock({ title, part, loading, error, onGenerate }: MissingPartBlockProps) {
  return (
    <div className="output-block">
      <div className="output-header">
        <h3>{title}</h3>
        <div className="output-actions">
          <button onClick={() => onGenerate(part)} disabled={loading}>
            {loading ? 'กำลังสร้าง...' : 'กดเพื่อสร้างส่วนนี้'}
          </button>
        </div>
      </div>
      <div className="missing-box">
        <p>ส่วนนี้ถูกข้ามไว้ตามที่คุณเลือกตอนสร้าง Prompt</p>
        <p className="hint">กดปุ่ม "กดเพื่อสร้างส่วนนี้" เพื่อให้ AI สร้างเพิ่มจาก GetInfo Prompt ที่ได้มา</p>
      </div>
      {error && <div className="error-box">{error}</div>}
    </div>
  );
}

interface OutputPanelProps {
  result: GenerateResult;
  botName: string;
  onGeneratePart: (part: GeneratePart) => void;
  partLoading: GeneratePart | null;
  partError: { part: GeneratePart; message: string } | null;
}

export default function OutputPanel({ result, botName, onGeneratePart, partLoading, partError }: OutputPanelProps) {
  const safeName = (botName || 'bot').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');

  return (
    <section className="card">
      <h2>ผลลัพธ์</h2>
      <OutputBlock title="GetInfo Prompt" content={result.getinfo} filename={`${safeName}_getinfo.txt`} />
      {result.summary !== null ? (
        <OutputBlock title="Summary Prompt" content={result.summary} filename={`${safeName}_summary.txt`} />
      ) : (
        <MissingPartBlock
          title="Summary Prompt"
          part="summary"
          loading={partLoading === 'summary'}
          error={partError?.part === 'summary' ? partError.message : null}
          onGenerate={onGeneratePart}
        />
      )}
      <OutputBlock
        title="Check Parameter Template"
        content={result.check_parameter}
        filename={`${safeName}_check_parameter.txt`}
      />
      {result.example_answers !== null ? (
        <ExampleAnswersBlock
          title="ตัวอย่างคำตอบ (Chat Step Automate)"
          content={result.example_answers}
          filename={`${safeName}_chat_step_automate.json`}
          note="ตัวอย่างคำตอบของลูกค้าสำหรับใช้กับ Chat Step Automate — กดคัดลอกรายข้อเพื่อนำไปวางได้เลย หรือดาวน์โหลดทั้งชุดเป็นไฟล์ .json"
        />
      ) : (
        <MissingPartBlock
          title="ตัวอย่างคำตอบ (Chat Step Automate)"
          part="example_answers"
          loading={partLoading === 'example_answers'}
          error={partError?.part === 'example_answers' ? partError.message : null}
          onGenerate={onGeneratePart}
        />
      )}
    </section>
  );
}

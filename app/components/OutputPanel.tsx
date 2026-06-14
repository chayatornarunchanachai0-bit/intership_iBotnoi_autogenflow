'use client';

import { useState } from 'react';
import type { GenerateResult } from '@/lib/types';

interface OutputBlockProps {
  title: string;
  content: string;
  filename: string;
}

function OutputBlock({ title, content, filename }: OutputBlockProps) {
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

  function handleDownload() {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="output-block">
      <div className="output-header">
        <h3>{title}</h3>
        <div className="output-actions">
          <button onClick={handleCopy}>{copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}</button>
          <button onClick={handleDownload}>ดาวน์โหลด .txt</button>
        </div>
      </div>
      <textarea readOnly value={content} rows={18} />
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
    </section>
  );
}

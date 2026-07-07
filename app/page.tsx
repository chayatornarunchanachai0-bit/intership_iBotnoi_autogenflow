'use client';

import { useReducer, useState } from 'react';
import StepList from './components/StepList';
import OutputPanel from './components/OutputPanel';
import { PROVIDERS, getProviderInfo } from '@/lib/providers';
import { getDefaultSteps } from '@/lib/steps';
import type { GenerateResult, GeneratePart } from '@/lib/types';

interface GenerationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string;
  result: GenerateResult | null;
}

type GenerationAction =
  | { type: 'START' }
  | { type: 'SUCCESS'; result: GenerateResult }
  | { type: 'ERROR'; error: string }
  | { type: 'SET_PART'; part: GeneratePart; content: string };

const initialGenerationState: GenerationState = { status: 'idle', error: '', result: null };

function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case 'START':
      return { status: 'loading', error: '', result: null };
    case 'SUCCESS':
      return { status: 'success', error: '', result: action.result };
    case 'ERROR':
      return { status: 'error', error: action.error, result: null };
    case 'SET_PART':
      if (!state.result) return state;
      return { ...state, result: { ...state.result, [action.part]: action.content } };
    default:
      return state;
  }
}

export default function Home() {
  const [provider, setProvider] = useState('groq');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [botName, setBotName] = useState('น้องเอไอ');
  const [businessDescription, setBusinessDescription] = useState('');
  const [steps, setSteps] = useState(getDefaultSteps);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeExampleAnswers, setIncludeExampleAnswers] = useState(true);
  const [generation, dispatch] = useReducer(generationReducer, initialGenerationState);
  const [partLoading, setPartLoading] = useState<GeneratePart | null>(null);
  const [partError, setPartError] = useState<{ part: GeneratePart; message: string } | null>(null);

  const providerInfo = getProviderInfo(provider);
  const isAuto = mode === 'auto';
  const autoModeMissingDescription = isAuto && !businessDescription.trim();
  const loading = generation.status === 'loading';

  async function handleGenerate() {
    dispatch({ type: 'START' });
    setPartError(null);

    const getinfoSteps = steps.filter((s) => s.enabled && s.section === 'getinfo');
    const summarySteps = steps.filter((s) => s.enabled && s.section === 'summary');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          model,
          mode,
          botName,
          businessDescription,
          getinfoSteps,
          summarySteps,
          includeSummary,
          includeExampleAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      dispatch({ type: 'SUCCESS', result: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      dispatch({ type: 'ERROR', error: message });
    }
  }

  // สั่งสร้างส่วนที่ข้ามไว้ (summary / example_answers) เพิ่มภายหลัง เป็น request แยกขนาดเล็ก
  async function handleGeneratePart(part: GeneratePart) {
    if (!generation.result) return;
    setPartLoading(part);
    setPartError(null);

    const summarySteps = steps.filter((s) => s.enabled && s.section === 'summary');

    try {
      const res = await fetch('/api/generate-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          model,
          part,
          mode,
          botName,
          businessDescription,
          summarySteps: mode === 'manual' ? summarySteps : [],
          getinfo: generation.result.getinfo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      dispatch({ type: 'SET_PART', part, content: data.content });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setPartError({ part, message });
    } finally {
      setPartLoading(null);
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>Botnoi Agentic Builder</h1>
        <p>Automation flow generator</p>
      </header>

      <section className="card">
        <h2>1. ตั้งค่า AI</h2>
        <div className="grid-3">
          <label>
            AI Provider
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setModel('');
              }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            API Key
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={providerInfo.keyPlaceholder}
            />
          </label>
          <label>
            Model (ไม่บังคับ)
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={providerInfo.defaultModel}
            />
          </label>
        </div>
        <p className="hint">
          {providerInfo.helpText} — API Key จะถูกส่งไปเรียกใช้งานทันที ไม่ถูกบันทึกไว้บนเซิร์ฟเวอร์
        </p>
      </section>

      <section className="card">
        <h2>2. ข้อมูลบอท</h2>
        <div className="grid-2">
          <label>
            ชื่อบอท (BOT_NAME)
            <input
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="เช่น น้องเอไอ"
            />
          </label>
        </div>

        <div className="mode-toggle">
          <label className={`mode-option ${isAuto ? 'active' : ''}`}>
            <input type="radio" name="mode" value="auto" checked={isAuto} onChange={() => setMode('auto')} />
            <div>
              <strong>ให้ AI ออกแบบ Flow ให้อัตโนมัติ</strong>
              <p>บอกแค่ว่าร้าน/บริการของคุณคืออะไร ขายอะไร AI จะออกแบบ Flow และตัวแปรให้เองทั้งหมด</p>
            </div>
          </label>
          <label className={`mode-option ${!isAuto ? 'active' : ''}`}>
            <input type="radio" name="mode" value="manual" checked={!isAuto} onChange={() => setMode('manual')} />
            <div>
              <strong>ออกแบบ Flow เอง</strong>
              <p>เลือก เปิด/ปิด และจัดเรียง Step ทั้ง 11 ขั้นตอนได้แบบละเอียดเอง</p>
            </div>
          </label>
        </div>

        <label className="block">
          รายละเอียดธุรกิจ {isAuto && <span className="required-mark">*</span>}
          <textarea
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            rows={isAuto ? 5 : 3}
            placeholder="เช่น ร้านอาหารญี่ปุ่น เดลิเวอรี่ มีเมนูซูชิ ราคาตามเซ็ต มีค่าจัดส่งตามระยะทาง"
          />
          {isAuto && (
            <span className="hint" style={{ marginTop: 4 }}>
              จำเป็นสำหรับโหมดนี้ — อธิบายให้ละเอียดเพื่อให้ AI ออกแบบ Flow ได้ตรงกับธุรกิจของคุณมากที่สุด
            </span>
          )}
        </label>

        <div className="mt-5">
          <span className="block font-semibold mb-2">ส่วนเสริมที่ให้สร้างด้วย</span>
          <div className="flex flex-wrap gap-3">
            {[
              {
                title: 'Summary Prompt',
                subtitle: 'Prompt สรุปรายการและส่งข้อมูลเข้าระบบ',
                checked: includeSummary,
                toggle: setIncludeSummary,
              },
              {
                title: 'ตัวอย่างคำตอบ (Chat Step Automate)',
                subtitle: 'ไฟล์ JSON สำหรับทดสอบบอทอัตโนมัติ',
                checked: includeExampleAnswers,
                toggle: setIncludeExampleAnswers,
              },
            ].map((opt) => (
              <label
                key={opt.title}
                className={`flex cursor-pointer select-none items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${
                  opt.checked
                    ? 'border-[#01bffb]/70 bg-[#01bffb]/10 shadow-[0_4px_16px_rgba(1,191,251,0.25)]'
                    : 'border-white/70 bg-white/40 shadow-[0_2px_8px_rgba(31,36,51,0.06)] hover:border-[#01bffb]/40 hover:bg-white/65'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={opt.checked}
                  onChange={(e) => opt.toggle(e.target.checked)}
                />
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    opt.checked
                      ? 'bg-gradient-to-br from-[#01bffb] to-[#0099cc] text-white shadow-[0_2px_6px_rgba(1,191,251,0.4)]'
                      : 'border border-[#5b6472]/40 text-[#5b6472]'
                  }`}
                >
                  {opt.checked ? (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 3.5v9M3.5 8h9" />
                    </svg>
                  )}
                </span>
                <span>
                  <span className={`block text-[0.92rem] font-semibold ${opt.checked ? 'text-[#0099cc]' : 'text-[var(--text)]'}`}>
                    {opt.title}
                  </span>
                  <span className="block text-[0.78rem] text-[var(--muted)]">{opt.subtitle}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 mb-0 text-[0.85rem] text-[var(--muted)]">
            ไม่เลือกตอนนี้ก็สั่งสร้างเพิ่มภายหลังได้จากหน้าผลลัพธ์ — request เล็กลง ลดโอกาสติด rate limit
          </p>
        </div>
      </section>

      {!isAuto && (
        <section className="card">
          <h2>3. ออกแบบ Flow</h2>
          <StepList steps={steps} setSteps={setSteps} />
        </section>
      )}

      <div className="actions">
        <button className="generate-btn" onClick={handleGenerate} disabled={loading || autoModeMissingDescription}>
          {loading ? 'กำลังสร้าง Prompt...' : '✨ สร้าง Prompt'}
        </button>
      </div>

      {generation.error && <div className="error-box">{generation.error}</div>}

      {generation.result && (
        <OutputPanel
          result={generation.result}
          botName={botName}
          onGeneratePart={handleGeneratePart}
          partLoading={partLoading}
          partError={partError}
        />
      )}
    </main>
  );
}

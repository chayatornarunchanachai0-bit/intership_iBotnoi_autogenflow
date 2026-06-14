'use client';

import { useReducer, useState } from 'react';
import StepList from './components/StepList';
import OutputPanel from './components/OutputPanel';
import { PROVIDERS, getProviderInfo } from '@/lib/providers';
import { getDefaultSteps } from '@/lib/steps';
import type { GenerateResult } from '@/lib/types';

interface GenerationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string;
  result: GenerateResult | null;
}

type GenerationAction =
  | { type: 'START' }
  | { type: 'SUCCESS'; result: GenerateResult }
  | { type: 'ERROR'; error: string };

const initialGenerationState: GenerationState = { status: 'idle', error: '', result: null };

function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case 'START':
      return { status: 'loading', error: '', result: null };
    case 'SUCCESS':
      return { status: 'success', error: '', result: action.result };
    case 'ERROR':
      return { status: 'error', error: action.error, result: null };
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
  const [generation, dispatch] = useReducer(generationReducer, initialGenerationState);

  const providerInfo = getProviderInfo(provider);
  const isAuto = mode === 'auto';
  const autoModeMissingDescription = isAuto && !businessDescription.trim();
  const loading = generation.status === 'loading';

  async function handleGenerate() {
    dispatch({ type: 'START' });

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

      {generation.result && <OutputPanel result={generation.result} botName={botName} />}
    </main>
  );
}

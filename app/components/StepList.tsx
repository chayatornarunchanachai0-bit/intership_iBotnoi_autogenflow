'use client';

import { useState } from 'react';
import type { Dispatch, DragEvent, SetStateAction } from 'react';
import { createCustomStep, type Step } from '@/lib/steps';

interface StepListProps {
  steps: Step[];
  setSteps: Dispatch<SetStateAction<Step[]>>;
}

export default function StepList({ steps, setSteps }: StepListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateStep(id: string, patch: Partial<Step>) {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStep(id: string) {
    setSteps(steps.filter((s) => s.id !== id));
  }

  function addStep() {
    setSteps([...steps, createCustomStep()]);
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...steps];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    setSteps(next);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  return (
    <div>
      <p className="hint" style={{ marginTop: 0, marginBottom: 14 }}>
        ลากที่ไอคอน ⠿ เพื่อจัดเรียงลำดับ Step, ติ๊กเพื่อเปิด/ปิดการใช้งาน,
        และเลือกว่า Step นี้อยู่ในส่วน getinfo (เก็บข้อมูล) หรือ summary (สรุป/ยืนยัน/ส่งระบบ)
      </p>
      <div className="step-list">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step-card ${step.enabled ? '' : 'disabled'} ${dragIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="step-row">
              <span className="drag-handle">⠿</span>
              <input
                type="checkbox"
                checked={step.enabled}
                onChange={(e) => updateStep(step.id, { enabled: e.target.checked })}
                title="เปิด/ปิดการใช้งาน Step นี้"
              />
              <input
                className="step-title"
                value={step.title}
                onChange={(e) => updateStep(step.id, { title: e.target.value })}
              />
              <select
                value={step.section}
                onChange={(e) => updateStep(step.id, { section: e.target.value as Step['section'] })}
                title="กำหนดว่า Step นี้อยู่ใน Prompt ส่วนไหน"
              >
                <option value="getinfo">getinfo</option>
                <option value="summary">summary</option>
              </select>
              <button className="remove-btn" onClick={() => removeStep(step.id)} title="ลบ Step นี้">
                ✕
              </button>
            </div>
            <div className="step-details">
              <label>
                คำถาม / หน้าที่
                <textarea
                  value={step.question}
                  onChange={(e) => updateStep(step.id, { question: e.target.value })}
                  rows={2}
                  placeholder="เช่น ลูกค้าสนใจสินค้าหรือบริการประเภทไหนคะ"
                />
              </label>
              <label>
                ตัวแปร (คั่นด้วย ,)
                <input
                  value={step.variables}
                  onChange={(e) => updateStep(step.id, { variables: e.target.value })}
                  placeholder="เช่น product_type"
                />
              </label>
              <label>
                หมายเหตุเพิ่มเติม
                <input
                  value={step.notes}
                  onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                  placeholder="กฎ/เงื่อนไขเพิ่มเติม (ถ้ามี)"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button className="add-step-btn" onClick={addStep}>
        + เพิ่ม Step ใหม่
      </button>
    </div>
  );
}

import { NextResponse } from 'next/server';
import { callProvider } from '@/lib/providers';
import { normalizeExampleAnswers, stripWrappingCodeFence } from '@/lib/outputParsing';
import {
  SYSTEM_PROMPT_EXAMPLE_ANSWERS,
  buildExampleAnswersPrompt,
  buildSummaryPartSystemPrompt,
  buildSummaryPartUserPrompt,
} from '@/lib/promptBuilder';
import type { GeneratePartRequestBody } from '@/lib/types';

// สร้างผลลัพธ์เฉพาะส่วนที่ผู้ใช้ข้ามไว้ตอน generate หลัก (summary หรือ example_answers)
// เป็น request ขนาดเล็ก ใช้ getinfo ที่สร้างไว้แล้วเป็นบริบท
export async function POST(request: Request) {
  let body: GeneratePartRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง' }, { status: 400 });
  }

  const { provider, apiKey, model, part, botName, businessDescription, mode, summarySteps, getinfo } = body;

  if (!provider || !apiKey?.trim()) {
    return NextResponse.json({ error: 'กรุณาเลือก AI Provider และกรอก API Key' }, { status: 400 });
  }
  if (!getinfo?.trim()) {
    return NextResponse.json({ error: 'ไม่พบ getinfo prompt สำหรับใช้อ้างอิง กรุณาสร้าง Prompt หลักก่อน' }, { status: 400 });
  }
  if (part !== 'summary' && part !== 'example_answers') {
    return NextResponse.json({ error: 'ไม่รู้จักส่วนที่ขอสร้าง' }, { status: 400 });
  }

  try {
    let content: string;

    if (part === 'summary') {
      const steps = summarySteps ?? [];
      const useManualSteps = mode === 'manual' && steps.length > 0;
      const raw = await callProvider({
        provider,
        apiKey,
        model,
        systemPrompt: buildSummaryPartSystemPrompt(useManualSteps),
        userPrompt: buildSummaryPartUserPrompt({
          botName,
          businessDescription,
          summarySteps: useManualSteps ? steps : [],
          getinfo,
        }),
        maxTokens: 3000,
      });
      content = stripWrappingCodeFence(raw);
    } else {
      const raw = await callProvider({
        provider,
        apiKey,
        model,
        systemPrompt: SYSTEM_PROMPT_EXAMPLE_ANSWERS,
        userPrompt: buildExampleAnswersPrompt({ botName, businessDescription, getinfo }),
        maxTokens: 2000,
      });
      content = normalizeExampleAnswers(raw);
    }

    if (!content) {
      throw new Error(`AI ตอบกลับไม่ครบถ้วน (ไม่มีเนื้อหาในส่วน: ${part})`);
    }

    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จัก';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

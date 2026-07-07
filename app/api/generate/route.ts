import { NextResponse } from 'next/server';
import { callProvider } from '@/lib/providers';
import { SECTION_MARKERS } from '@/lib/constants';
import {
  SYSTEM_PROMPT_MANUAL,
  SYSTEM_PROMPT_AUTO,
  SYSTEM_PROMPT_EXAMPLE_ANSWERS,
  buildUserPrompt,
  buildUserPromptAuto,
  buildExampleAnswersPrompt,
} from '@/lib/promptBuilder';
import type { GenerateRequestBody, GenerateResult } from '@/lib/types';

export async function POST(request: Request) {
  let body: GenerateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง' }, { status: 400 });
  }

  const { provider, apiKey, model, botName, businessDescription, mode, getinfoSteps, summarySteps } = body;

  if (!provider || !apiKey?.trim()) {
    return NextResponse.json({ error: 'กรุณาเลือก AI Provider และกรอก API Key' }, { status: 400 });
  }
  if (!botName?.trim()) {
    return NextResponse.json({ error: 'กรุณากรอกชื่อบอท (BOT_NAME)' }, { status: 400 });
  }

  const isAuto = mode === 'auto';
  let systemPrompt: string;
  let userPrompt: string;

  if (isAuto) {
    if (!businessDescription?.trim()) {
      return NextResponse.json(
        { error: 'กรุณาอธิบายธุรกิจของคุณก่อน เพื่อให้ AI ออกแบบ Flow ให้' },
        { status: 400 },
      );
    }
    systemPrompt = SYSTEM_PROMPT_AUTO;
    userPrompt = buildUserPromptAuto({ botName, businessDescription });
  } else {
    if (!getinfoSteps?.length && !summarySteps?.length) {
      return NextResponse.json({ error: 'กรุณาเปิดใช้งานอย่างน้อย 1 Step' }, { status: 400 });
    }
    systemPrompt = SYSTEM_PROMPT_MANUAL;
    userPrompt = buildUserPrompt({
      botName,
      businessDescription,
      getinfoSteps: getinfoSteps ?? [],
      summarySteps: summarySteps ?? [],
    });
  }

  try {
    // รอบที่ 1: สร้าง prompt 3 ส่วน (getinfo, summary, check_parameter)
    // แยกเป็น 2 รอบเพื่อลดขนาดต่อ request ให้อยู่ใต้เพดาน TPM ของ Groq free tier
    const raw = await callProvider({ provider, apiKey, model, systemPrompt, userPrompt, maxTokens: 6000 });
    const parsed = extractSections(raw);

    const emptyParts = Object.entries(parsed)
      .filter(([, content]) => !content)
      .map(([key]) => key);

    if (emptyParts.length) {
      console.error('[generate] ส่วนต่อไปนี้ไม่มีเนื้อหา:', emptyParts.join(', '), '\n--- Raw AI response ---\n', raw);
      throw new Error(`AI ตอบกลับไม่ครบถ้วน (ไม่มีเนื้อหาในส่วน: ${emptyParts.join(', ')})`);
    }

    // รอบที่ 2: สร้าง example_answers จาก getinfo ที่ได้จากรอบแรก
    const exampleRaw = await callProvider({
      provider,
      apiKey,
      model,
      systemPrompt: SYSTEM_PROMPT_EXAMPLE_ANSWERS,
      userPrompt: buildExampleAnswersPrompt({ botName, businessDescription, getinfo: parsed.getinfo }),
      maxTokens: 2000,
    });
    const example_answers = normalizeExampleAnswers(exampleRaw);
    if (!example_answers) {
      console.error('[generate] example_answers ไม่มีเนื้อหา\n--- Raw AI response ---\n', exampleRaw);
      throw new Error('AI ตอบกลับไม่ครบถ้วน (ไม่มีเนื้อหาในส่วน: example_answers)');
    }

    const result: GenerateResult = { ...parsed, example_answers };
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จัก';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// จับ marker แบบ flexible: ไม่สนตัวพิมพ์ใหญ่-เล็ก และยอมให้มีเว้นวรรค/เครื่องหมาย = มากกว่ารูปแบบมาตรฐานได้
const MARKER_PATTERNS = {
  getinfo: /=+\s*GETINFO\s*=+/i,
  summary: /=+\s*SUMMARY\s*=+/i,
  check_parameter: /=+\s*CHECK_PARAMETER\s*=+/i,
  end: /=+\s*END\s*=+/i,
};

// จัดรูปแบบ JSON ตัวอย่างคำตอบให้พร้อมบันทึกเป็นไฟล์ .json (ตัด code fence ที่อาจติดมา แล้ว pretty-print)
function normalizeExampleAnswers(raw: string): string {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    // ถ้า parse ไม่ได้ ให้คืนข้อความเดิมเพื่อให้ผู้ใช้เห็นและแก้เองได้
    return text;
  }
}

function extractSections(text: string): Omit<GenerateResult, 'example_answers'> {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:[a-z]*)?\s*([\s\S]*?)```/i);
  // ใช้เนื้อหาใน code fence เฉพาะเมื่อมี marker ครบอยู่ข้างใน (กันกรณี AI ครอบทั้งหมดด้วย fence)
  if (fenceMatch && MARKER_PATTERNS.getinfo.test(fenceMatch[1])) cleaned = fenceMatch[1].trim();

  const getinfoMatch = cleaned.match(MARKER_PATTERNS.getinfo);
  const summaryMatch = cleaned.match(MARKER_PATTERNS.summary);
  const checkMatch = cleaned.match(MARKER_PATTERNS.check_parameter);

  const missing: string[] = [];
  if (!getinfoMatch) missing.push(SECTION_MARKERS.getinfo);
  if (!summaryMatch) missing.push(SECTION_MARKERS.summary);
  if (!checkMatch) missing.push(SECTION_MARKERS.check_parameter);

  if (missing.length) {
    console.error('[generate] ไม่พบ marker:', missing.join(', '), '\n--- Raw AI response ---\n', text);
    throw new Error(`AI ตอบกลับไม่ครบถ้วน (ไม่พบส่วน: ${missing.join(', ')})`);
  }

  // missing.length === 0 guarantees these matches are non-null
  const getinfoIdx = getinfoMatch!.index!;
  const summaryIdx = summaryMatch!.index!;
  const checkIdx = checkMatch!.index!;

  const endMatch = cleaned.match(MARKER_PATTERNS.end);
  const checkEnd = endMatch ? endMatch.index! : cleaned.length;

  return {
    getinfo: cleaned.slice(getinfoIdx + getinfoMatch![0].length, summaryIdx).trim(),
    summary: cleaned.slice(summaryIdx + summaryMatch![0].length, checkIdx).trim(),
    check_parameter: cleaned.slice(checkIdx + checkMatch![0].length, checkEnd).trim(),
  };
}

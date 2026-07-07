import { NextResponse } from 'next/server';
import { callProvider } from '@/lib/providers';
import { SECTION_MARKERS } from '@/lib/constants';
import { normalizeExampleAnswers } from '@/lib/outputParsing';
import {
  SYSTEM_PROMPT_EXAMPLE_ANSWERS,
  buildSystemPromptManual,
  buildSystemPromptAuto,
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
  const includeSummary = body.includeSummary !== false;
  const includeExampleAnswers = body.includeExampleAnswers !== false;

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
    systemPrompt = buildSystemPromptAuto(includeSummary);
    userPrompt = buildUserPromptAuto({ botName, businessDescription, includeSummary });
  } else {
    if (!getinfoSteps?.length && !summarySteps?.length) {
      return NextResponse.json({ error: 'กรุณาเปิดใช้งานอย่างน้อย 1 Step' }, { status: 400 });
    }
    systemPrompt = buildSystemPromptManual(includeSummary);
    userPrompt = buildUserPrompt({
      botName,
      businessDescription,
      getinfoSteps: getinfoSteps ?? [],
      summarySteps: summarySteps ?? [],
      includeSummary,
    });
  }

  try {
    // รอบที่ 1: สร้าง prompt ส่วนหลัก (getinfo, check_parameter และ summary ถ้าเลือกไว้)
    // แยกเป็นหลายรอบเพื่อลดขนาดต่อ request ให้อยู่ใต้เพดาน TPM ของ Groq free tier
    const raw = await callProvider({
      provider,
      apiKey,
      model,
      systemPrompt,
      userPrompt,
      maxTokens: includeSummary ? 6000 : 4500,
    });
    const parsed = extractSections(raw, includeSummary);

    const emptyParts = Object.entries(parsed)
      .filter(([key, content]) => content === '' && (key !== 'summary' || includeSummary))
      .map(([key]) => key);

    if (emptyParts.length) {
      console.error('[generate] ส่วนต่อไปนี้ไม่มีเนื้อหา:', emptyParts.join(', '), '\n--- Raw AI response ---\n', raw);
      throw new Error(`AI ตอบกลับไม่ครบถ้วน (ไม่มีเนื้อหาในส่วน: ${emptyParts.join(', ')})`);
    }

    // รอบที่ 2 (ถ้าเลือกไว้): สร้าง example_answers จาก getinfo ที่ได้จากรอบแรก
    let example_answers: string | null = null;
    if (includeExampleAnswers) {
      const exampleRaw = await callProvider({
        provider,
        apiKey,
        model,
        systemPrompt: SYSTEM_PROMPT_EXAMPLE_ANSWERS,
        userPrompt: buildExampleAnswersPrompt({ botName, businessDescription, getinfo: parsed.getinfo }),
        maxTokens: 2000,
      });
      example_answers = normalizeExampleAnswers(exampleRaw);
      if (!example_answers) {
        console.error('[generate] example_answers ไม่มีเนื้อหา\n--- Raw AI response ---\n', exampleRaw);
        throw new Error('AI ตอบกลับไม่ครบถ้วน (ไม่มีเนื้อหาในส่วน: example_answers)');
      }
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

function extractSections(text: string, includeSummary: boolean): Omit<GenerateResult, 'example_answers'> {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:[a-z]*)?\s*([\s\S]*?)```/i);
  // ใช้เนื้อหาใน code fence เฉพาะเมื่อมี marker ครบอยู่ข้างใน (กันกรณี AI ครอบทั้งหมดด้วย fence)
  if (fenceMatch && MARKER_PATTERNS.getinfo.test(fenceMatch[1])) cleaned = fenceMatch[1].trim();

  const getinfoMatch = cleaned.match(MARKER_PATTERNS.getinfo);
  const summaryMatch = cleaned.match(MARKER_PATTERNS.summary);
  const checkMatch = cleaned.match(MARKER_PATTERNS.check_parameter);

  const missing: string[] = [];
  if (!getinfoMatch) missing.push(SECTION_MARKERS.getinfo);
  if (includeSummary && !summaryMatch) missing.push(SECTION_MARKERS.summary);
  if (!checkMatch) missing.push(SECTION_MARKERS.check_parameter);

  if (missing.length) {
    console.error('[generate] ไม่พบ marker:', missing.join(', '), '\n--- Raw AI response ---\n', text);
    throw new Error(`AI ตอบกลับไม่ครบถ้วน (ไม่พบส่วน: ${missing.join(', ')})`);
  }

  // missing.length === 0 guarantees the required matches are non-null
  const getinfoIdx = getinfoMatch!.index!;
  const checkIdx = checkMatch!.index!;
  // ถ้าโมเดลเผลอใส่ ===SUMMARY=== มาทั้งที่ไม่ได้ขอ ให้ getinfo จบตรง marker แรกที่เจอ
  const summaryIdx = summaryMatch?.index;
  const getinfoEnd = summaryIdx !== undefined && summaryIdx < checkIdx ? summaryIdx : checkIdx;

  const endMatch = cleaned.match(MARKER_PATTERNS.end);
  const checkEnd = endMatch ? endMatch.index! : cleaned.length;

  return {
    getinfo: cleaned.slice(getinfoIdx + getinfoMatch![0].length, getinfoEnd).trim(),
    summary:
      includeSummary && summaryMatch
        ? cleaned.slice(summaryIdx! + summaryMatch[0].length, checkIdx).trim()
        : null,
    check_parameter: cleaned.slice(checkIdx + checkMatch![0].length, checkEnd).trim(),
  };
}

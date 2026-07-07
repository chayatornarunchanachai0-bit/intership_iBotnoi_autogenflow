// Helper สำหรับจัดรูปแบบผลลัพธ์จาก AI — ใช้ร่วมกันระหว่าง /api/generate และ /api/generate-part

// ตัด code fence ที่ครอบทั้งข้อความออก (ถ้ามี)
export function stripWrappingCodeFence(raw: string): string {
  const text = raw.trim();
  const match = text.match(/^```(?:[a-z]*)?\s*([\s\S]*?)```$/i);
  return match ? match[1].trim() : text;
}

// จัดรูปแบบ JSON ตัวอย่างคำตอบให้พร้อมบันทึกเป็นไฟล์ .json (ตัด code fence ที่อาจติดมา แล้ว pretty-print)
export function normalizeExampleAnswers(raw: string): string {
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

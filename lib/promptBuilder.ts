import {
  SYNTAX_GUIDE,
  EXAMPLE_ANSWERS_GUIDE,
  EXAMPLE_ANSWERS_OUTPUT_GUIDE,
  OUTPUT_FORMAT_GUIDE,
} from './prompts/systemGuides';
import { CHECK_PARAMETER_GUIDE } from './prompts/checkParameterGuide';
import {
  GETINFO_STRUCTURE_MANUAL,
  GETINFO_STRUCTURE_AUTO,
  GENERIC_TEMPLATE_FLOW,
  PRICING_STEP_RULE,
} from './prompts/getinfoPrompt';
import { SUMMARY_STRUCTURE_MANUAL, SUMMARY_STRUCTURE_AUTO } from './prompts/summaryPrompt';
import type { Step } from './steps';

export const SYSTEM_PROMPT_MANUAL = `คุณคือผู้เชี่ยวชาญด้านการเขียน Prompt ภาษาไทยสำหรับ Chatbot รับคำสั่งซื้อสินค้า/บริการ และจองบริการให้ธุรกิจต่าง ๆ บนระบบแชทบอท

งานของคุณ: สร้างผลลัพธ์ 3 ส่วน คือ Prompt "getinfo", "summary", "check_parameter" ให้ตรงตามโครงสร้างด้านล่างทุกประการ โดยปรับถ้อยคำให้เหมาะกับธุรกิจที่ผู้ใช้อธิบายมา

${SYNTAX_GUIDE}

${GETINFO_STRUCTURE_MANUAL}

${SUMMARY_STRUCTURE_MANUAL}

${CHECK_PARAMETER_GUIDE}

${OUTPUT_FORMAT_GUIDE}`;

function formatSteps(steps: Step[]): string {
  if (!steps.length) return '(ไม่มี)';
  return steps
    .map((step, index) => {
      const lines = [`${index + 1}. ${step.title}`];
      if (step.question?.trim()) lines.push(`   - คำถาม/หน้าที่เดิม: ${step.question.trim()}`);
      if (step.variables?.trim()) lines.push(`   - ตัวแปรที่ต้องเก็บ: ${step.variables.trim()}`);
      if (step.notes?.trim()) lines.push(`   - หมายเหตุ: ${step.notes.trim()}`);
      return lines.join('\n');
    })
    .join('\n');
}

function collectVariables(steps: Step[]): string[] {
  const vars = new Set<string>();
  steps.forEach((step) => {
    (step.variables || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .forEach((v) => vars.add(v));
  });
  return Array.from(vars);
}

interface BuildUserPromptParams {
  botName: string;
  businessDescription?: string;
  getinfoSteps: Step[];
  summarySteps: Step[];
}

export function buildUserPrompt({ botName, businessDescription, getinfoSteps, summarySteps }: BuildUserPromptParams): string {
  const allVariables = collectVariables(getinfoSteps);

  return `สร้าง Prompt สำหรับ Chatbot ดังนี้:

BOT_NAME: ${botName}

รายละเอียดธุรกิจ:
${businessDescription?.trim() || '(ไม่ได้ระบุ ให้ใช้เป็น Generic Template ทั่วไป)'}

== รายการ Step สำหรับ getinfo (เรียงตามลำดับ) ==
${formatSteps(getinfoSteps)}

== รายการ Step สำหรับ summary (เรียงตามลำดับ) ==
${formatSteps(summarySteps)}

== ตัวแปรทั้งหมดที่ระบบจะส่งจาก getinfo ไปยัง summary ==
${allVariables.length ? allVariables.map((v) => `<${v}>`).join(', ') : '(ไม่มี)'}

กรุณาสร้างผลลัพธ์ทั้ง 3 ส่วน (getinfo, summary และ check_parameter) ตามโครงสร้างที่กำหนด และตอบกลับตามรูปแบบที่ระบุเท่านั้น`;
}

export const SYSTEM_PROMPT_AUTO = `คุณคือผู้เชี่ยวชาญด้านการออกแบบ Flow การสนทนา และเขียน Prompt ภาษาไทยสำหรับ Chatbot รับคำสั่งซื้อสินค้า/บริการ และจองบริการให้ธุรกิจต่าง ๆ บนระบบแชทบอท

งานของคุณ: ผู้ใช้จะอธิบายธุรกิจของตัวเองมาแบบสั้น ๆ (เช่น ขายอะไร ให้บริการอะไร มีเงื่อนไขอะไรบ้าง) โดยไม่ได้กำหนด Step มาให้ ให้คุณ:
1. ออกแบบ Flow การสนทนาที่เหมาะสมกับธุรกิจนั้นด้วยตัวเอง โดยใช้ "Generic Template Flow" ด้านล่างเป็นแนวทางหลัก สามารถเพิ่ม ลด รวม Step หรือปรับให้เข้ากับธุรกิจจริงได้ (เช่น ร้านอาหารไม่มีหลายสาขาอาจตัด Step สาขาออก หรือบริการนัดหมายอาจเน้นวัน/เวลามากกว่าจำนวน)
2. กำหนดชื่อตัวแปร (variable) เป็นภาษาอังกฤษแบบ snake_case ที่เหมาะสมสำหรับเก็บข้อมูลของแต่ละ Step เอง (เช่น product_type, product_detail, quantity, date, time, total_price, customer_name, customer_phone, branch, address)
3. สร้างผลลัพธ์ 3 ส่วน คือ Prompt "getinfo", "summary", "check_parameter" ตามโครงสร้างที่กำหนดด้านล่างทุกประการ

${GENERIC_TEMPLATE_FLOW}

${PRICING_STEP_RULE}

${SYNTAX_GUIDE}

${GETINFO_STRUCTURE_AUTO}

${SUMMARY_STRUCTURE_AUTO}

${CHECK_PARAMETER_GUIDE}

${OUTPUT_FORMAT_GUIDE}`;

interface BuildUserPromptAutoParams {
  botName: string;
  businessDescription: string;
}

export function buildUserPromptAuto({ botName, businessDescription }: BuildUserPromptAutoParams): string {
  return `ออกแบบ Flow และสร้าง Prompt สำหรับ Chatbot ดังนี้:

BOT_NAME: ${botName}

รายละเอียดธุรกิจ:
${businessDescription.trim()}

กรุณาออกแบบ Flow ที่เหมาะสมกับธุรกิจนี้ด้วยตัวเอง (อ้างอิงจาก Generic Template Flow ที่กำหนด) กำหนดชื่อตัวแปรที่เหมาะสมเอง แล้วสร้างผลลัพธ์ทั้ง 3 ส่วน (getinfo, summary และ check_parameter) ตามโครงสร้างที่กำหนด ตอบกลับตามรูปแบบที่ระบุเท่านั้น`;
}

export const SYSTEM_PROMPT_EXAMPLE_ANSWERS = `คุณคือผู้เชี่ยวชาญด้านการสร้างข้อมูลทดสอบ Chatbot ภาษาไทย

งานของคุณ: ผู้ใช้จะส่ง getinfo prompt (ชุดคำถามที่บอทใช้ถามลูกค้า) มาให้ ให้คุณสร้างไฟล์ JSON "example_answers" ตัวอย่างคำตอบของลูกค้าสำหรับใช้กับ Chat Step Automate

${EXAMPLE_ANSWERS_GUIDE}

${EXAMPLE_ANSWERS_OUTPUT_GUIDE}`;

interface BuildExampleAnswersPromptParams {
  botName: string;
  businessDescription?: string;
  getinfo: string;
}

export function buildExampleAnswersPrompt({ botName, businessDescription, getinfo }: BuildExampleAnswersPromptParams): string {
  return `สร้างไฟล์ JSON ตัวอย่างคำตอบของลูกค้า (example_answers) จาก getinfo prompt ต่อไปนี้:

BOT_NAME: ${botName}

รายละเอียดธุรกิจ:
${businessDescription?.trim() || '(ไม่ได้ระบุ ให้สมมติคำตอบทั่วไปที่สมเหตุสมผล)'}

== getinfo prompt ==
${getinfo}

กรุณาตอบกลับเป็น JSON ตามโครงสร้าง example_answers เท่านั้น`;
}

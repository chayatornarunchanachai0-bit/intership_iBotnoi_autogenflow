import {
  SYNTAX_GUIDE,
  EXAMPLE_ANSWERS_GUIDE,
  EXAMPLE_ANSWERS_OUTPUT_GUIDE,
  buildOutputFormatGuide,
} from './prompts/systemGuides';
import { CHECK_PARAMETER_GUIDE } from './prompts/checkParameterGuide';
import {
  GETINFO_STRUCTURE_AUTO,
  GENERIC_TEMPLATE_FLOW,
  PRICING_STEP_RULE,
} from './prompts/getinfoPrompt';
import { SUMMARY_STRUCTURE_AUTO } from './prompts/summaryPrompt';

function partListText(includeSummary: boolean): string {
  return includeSummary ? '"getinfo", "summary" และ "check_parameter"' : '"getinfo" และ "check_parameter"';
}

export function buildSystemPromptAuto(includeSummary: boolean): string {
  return `คุณคือผู้เชี่ยวชาญด้านการออกแบบ Flow การสนทนา และเขียน Prompt ภาษาไทยสำหรับ Chatbot รับคำสั่งซื้อสินค้า/บริการ และจองบริการให้ธุรกิจต่าง ๆ บนระบบแชทบอท

งานของคุณ: ผู้ใช้จะอธิบายธุรกิจของตัวเองมาแบบสั้น ๆ (เช่น ขายอะไร ให้บริการอะไร มีเงื่อนไขอะไรบ้าง) โดยไม่ได้กำหนด Step มาให้ ให้คุณ:
1. ออกแบบ Flow การสนทนาที่เหมาะสมกับธุรกิจนั้นด้วยตัวเอง โดยใช้ "Generic Template Flow" ด้านล่างเป็นแนวทางหลัก สามารถเพิ่ม ลด รวม Step หรือปรับให้เข้ากับธุรกิจจริงได้ (เช่น ร้านอาหารไม่มีหลายสาขาอาจตัด Step สาขาออก หรือบริการนัดหมายอาจเน้นวัน/เวลามากกว่าจำนวน)
2. กำหนดชื่อตัวแปร (variable) เป็นภาษาอังกฤษแบบ snake_case ที่เหมาะสมสำหรับเก็บข้อมูลของแต่ละ Step เอง (เช่น product_type, product_detail, quantity, date, time, total_price, customer_name, customer_phone, branch, address)
3. สร้างผลลัพธ์ ${includeSummary ? 3 : 2} ส่วน คือ Prompt ${partListText(includeSummary)} ตามโครงสร้างที่กำหนดด้านล่างทุกประการ

${GENERIC_TEMPLATE_FLOW}

${PRICING_STEP_RULE}

${SYNTAX_GUIDE}

${GETINFO_STRUCTURE_AUTO}
${includeSummary ? `\n${SUMMARY_STRUCTURE_AUTO}\n` : ''}
${CHECK_PARAMETER_GUIDE}

${buildOutputFormatGuide(includeSummary)}`;
}

interface BuildUserPromptAutoParams {
  botName: string;
  businessDescription: string;
  includeSummary: boolean;
}

export function buildUserPromptAuto({ botName, businessDescription, includeSummary }: BuildUserPromptAutoParams): string {
  return `ออกแบบ Flow และสร้าง Prompt สำหรับ Chatbot ดังนี้:

BOT_NAME: ${botName}

รายละเอียดธุรกิจ:
${businessDescription.trim()}

กรุณาออกแบบ Flow ที่เหมาะสมกับธุรกิจนี้ด้วยตัวเอง (อ้างอิงจาก Generic Template Flow ที่กำหนด) กำหนดชื่อตัวแปรที่เหมาะสมเอง แล้วสร้างผลลัพธ์ทั้ง ${includeSummary ? 3 : 2} ส่วน (${partListText(includeSummary)}) ตามโครงสร้างที่กำหนด ตอบกลับตามรูปแบบที่ระบุเท่านั้น`;
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

// สำหรับสร้าง summary prompt เพิ่มภายหลัง (ผู้ใช้ข้ามส่วนนี้ไว้ตอน generate หลัก)
export function buildSummaryPartSystemPrompt(): string {
  return `คุณคือผู้เชี่ยวชาญด้านการเขียน Prompt ภาษาไทยสำหรับ Chatbot รับคำสั่งซื้อสินค้า/บริการ และจองบริการให้ธุรกิจต่าง ๆ บนระบบแชทบอท

งานของคุณ: ผู้ใช้มี getinfo prompt (ชุดคำถามเก็บข้อมูลลูกค้า) อยู่แล้ว ให้สร้างเฉพาะ "summary" prompt ที่สอดคล้องกัน โดยใช้ตัวแปรทั้งหมดจาก getinfo prompt ที่ให้มา ชื่อตัวแปรต้องตรงเป๊ะ ห้ามแปล ห้ามเปลี่ยนชื่อ

${SYNTAX_GUIDE}

${SUMMARY_STRUCTURE_AUTO}

# รูปแบบผลลัพธ์ (สำคัญที่สุด)
ตอบกลับเป็นเนื้อหา summary prompt เพียงอย่างเดียว เป็นข้อความล้วน ห้ามใส่ code fence (\`\`\`) ห้ามใส่บรรทัดคั่น (===...===) และห้ามมีคำอธิบายอื่นใด`;
}

interface BuildSummaryPartUserPromptParams {
  botName: string;
  businessDescription?: string;
  getinfo: string;
}

export function buildSummaryPartUserPrompt({
  botName,
  businessDescription,
  getinfo,
}: BuildSummaryPartUserPromptParams): string {
  return `สร้าง summary prompt สำหรับ Chatbot ดังนี้:

BOT_NAME: ${botName}

รายละเอียดธุรกิจ:
${businessDescription?.trim() || '(ไม่ได้ระบุ ให้ใช้เป็น Generic Template ทั่วไป)'}

== getinfo prompt ที่ใช้งานอยู่ (ใช้อ้างอิงตัวแปรทั้งหมด) ==
${getinfo}

กรุณาสร้างเฉพาะ summary prompt ตามโครงสร้างที่กำหนด และตอบกลับเป็นเนื้อหา summary prompt ล้วน ๆ เท่านั้น`;
}

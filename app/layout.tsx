import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Botnoi Agentic Builder | Automation flow generator',
  description:
    'ออกแบบ Flow และสร้าง Prompt สำหรับ Chatbot รับคำสั่งซื้อ/จองบริการ ด้วย AI (Groq, OpenAI, Gemini)',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

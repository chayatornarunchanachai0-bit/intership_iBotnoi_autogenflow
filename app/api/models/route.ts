import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey?.trim()) {
      return NextResponse.json({ error: 'กรุณาเลือก AI Provider และกรอก API Key' }, { status: 400 });
    }

    const trimmedApiKey = apiKey.trim();

    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${trimmedApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `ไม่สามารถดึงโมเดลจาก Groq ได้: ${response.status} ${errText.slice(0, 100)}` }, { status: response.status });
      }

      const data = await response.json();
      const models = (data.data || [])
        .map((m: any) => m.id)
        .filter((id: string) => !id.includes('whisper') && !id.includes('embed'));

      return NextResponse.json({ models });
    }

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${trimmedApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `ไม่สามารถดึงโมเดลจาก OpenAI ได้: ${response.status} ${errText.slice(0, 100)}` }, { status: response.status });
      }

      const data = await response.json();
      const models = (data.data || [])
        .map((m: any) => m.id)
        .filter((id: string) => 
          (id.startsWith('gpt-') || id.startsWith('o1-') || id.startsWith('o3-')) &&
          !id.includes('-audio') &&
          !id.includes('-realtime') &&
          !id.includes('-instruct')
        )
        .sort((a: string, b: string) => a.localeCompare(b));

      return NextResponse.json({ models });
    }

    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedApiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `ไม่สามารถดึงโมเดลจาก Gemini ได้: ${response.status} ${errText.slice(0, 100)}` }, { status: response.status });
      }

      const data = await response.json();
      const models = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace(/^models\//, ''));

      return NextResponse.json({ models });
    }

    return NextResponse.json({ error: 'ไม่สนับสนุน Provider นี้' }, { status: 400 });

  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: `เกิดข้อผิดพลาดภายในระบบ: ${error.message}` }, { status: 500 });
  }
}

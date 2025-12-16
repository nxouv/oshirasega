import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    const body = await req.json();
    const text = body.text;
    const mode = body.mode;

    console.log("API called with mode:", mode); // デバッグ用

    if (!text || typeof text !== 'string') {
        return new Response('Text is required', { status: 400 });
    }

    let systemPrompt = "";

    if (mode === 'fix') {
        systemPrompt = `あなたは日本語の校正者です。
入力された文章の誤字脱字・変換ミスのみを修正してください。

重要なルール：
- 文体や表現は一切変えない
- 句読点の位置も変えない
- 誤字脱字がなければ、そのまま返す
- 修正した文章のみを出力する（説明は不要）`;
    } else if (mode === 'polish') {
        systemPrompt = `あなたは日本語の編集者です。
入力された文章を、より自然で読みやすい日本語に整えてください。

重要なルール：
- 誤字脱字を修正する
- 不自然な言い回しを自然にする
- 敬語の誤りがあれば直す
- 文体（です・ます調など）は維持する
- 元の意図や内容は変えない
- 大幅な書き換えはしない
- 修正した文章のみを出力する（説明は不要）`;
    } else {
        // modeが不正な場合はエラーを返す
        return new Response('Invalid mode', { status: 400 });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `${systemPrompt}\n\n入力文:\n${text}\n\n出力:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const outputText = response.text();

        return new Response(outputText, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });
    } catch (error: any) {
        console.error("API Error:", error.message);
        return new Response(`AI generation failed: ${error.message}`, { status: 500 });
    }
}

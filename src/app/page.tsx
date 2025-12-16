"use client";

import { useState, useEffect } from "react";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Undo2,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
  Trash2
} from "lucide-react";
import PreviewCanvas from "../components/PreviewCanvas";
import { ThemeType, FontType, BackgroundType, THEMES, FONTS, BACKGROUNDS } from "@/lib/types";

const FumiLogo = () => (
  <div className="flex items-center gap-2">
    <img src="/logo.png" alt="" width={28} height={28} />
    <span
      className="text-gray-800 font-semibold"
      style={{ fontFamily: 'var(--font-noto-serif)' }}
    >
      おしらせ画
    </span>
  </div>
);

const STORAGE_KEY = "fumi-draft";
const AI_USAGE_KEY = "fumi-ai-usage";
const DAILY_LIMIT = 5;

interface DraftData {
  text: string;
  title: string;
  date: string;
  signature: string;
  theme: ThemeType;
  font: FontType;
  background: BackgroundType;
}

interface AIUsageData {
  date: string;
  count: number;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getAIUsage(): AIUsageData {
  const saved = localStorage.getItem(AI_USAGE_KEY);
  if (saved) {
    try {
      const data: AIUsageData = JSON.parse(saved);
      if (data.date === getTodayString()) {
        return data;
      }
    } catch (e) {
      console.error("Failed to parse AI usage:", e);
    }
  }
  return { date: getTodayString(), count: 0 };
}

function saveAIUsage(usage: AIUsageData): void {
  localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usage));
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeType>("formal");
  const [font, setFont] = useState<FontType>("mincho");
  const [background, setBackground] = useState<BackgroundType>("white");

  const [text, setText] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [signature, setSignature] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [backupText, setBackupText] = useState<string>("");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonText, setComparisonText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<'fix' | 'polish' | null>(null)
  const [isInitialized, setIsInitialized] = useState(false);

  const [aiUsage, setAiUsage] = useState<AIUsageData>({ date: getTodayString(), count: 0 });

  // LocalStorageから復元
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: DraftData = JSON.parse(saved);
        setText(data.text || "");
        setTitle(data.title || "");
        setDate(data.date || "");
        setSignature(data.signature || "");
        setTheme(data.theme || "formal");
        setFont(data.font || "mincho");
        setBackground(data.background || "white");
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }

    // AI使用回数を復元
    setAiUsage(getAIUsage());

    setIsInitialized(true);
  }, []);

  // LocalStorageに保存
  useEffect(() => {
    if (!isInitialized) return;
    const data: DraftData = { text, title, date, signature, theme, font, background };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [text, title, date, signature, theme, font, background, isInitialized]);

  // テーマ変更時にデフォルト設定を適用（カスタム以外）
  useEffect(() => {
    if (!isInitialized) return;
    const themeStyle = THEMES[theme];
    if (!themeStyle.isCustom) {
      setFont(themeStyle.defaultFont);
      setBackground(themeStyle.defaultBackground);
    }
  }, [theme, isInitialized]);

  const remainingCount = DAILY_LIMIT - aiUsage.count;
  const isLimitReached = remainingCount <= 0;

  const handleAiFix = async (mode: 'fix' | 'polish') => {
    if (!text || loadingMode) return;

    if (isLimitReached) {
      alert("本日の利用上限に達しました。明日またご利用ください。");
      return;
    }

    setBackupText(text);
    setLoadingMode(mode);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'AI generation failed');
      }

      const result = await response.text();

      if (!result || result.trim() === '') {
        throw new Error('AIからの応答が空でした');
      }

      const newUsage = { date: getTodayString(), count: aiUsage.count + 1 };
      setAiUsage(newUsage);
      saveAIUsage(newUsage);

      setComparisonText(result);
      setShowComparison(true);
    } catch (error) {
      console.error('AI Error:', error);
      const message = error instanceof Error ? error.message : '不明なエラー';
      alert(`AIチェックに失敗しました。\n\n${message}\n\nしばらく待ってからもう一度お試しください。`);
    } finally {
      setLoadingMode(null);
    }
  };

  const handleAccept = () => {
    setText(comparisonText);
    setShowComparison(false);
    setComparisonText("");
  };

  const handleReject = () => {
    setShowComparison(false);
    setComparisonText("");
  };

  const handleClear = () => {
    if (!text && !title && !date && !signature) return;
    if (confirm("入力内容をすべてクリアしますか？")) {
      setText("");
      setTitle("");
      setDate("");
      setSignature("");
      setTheme("formal");
      setFont("mincho");
      setBackground("white");
    }
  };

  const fontInfo = FONTS[font];
  const isCustomTheme = THEMES[theme].isCustom;
  const hasContent = text || title || date || signature;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-700 relative overflow-x-hidden">

      {showComparison && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-medium text-gray-800">AIが文章を修正しました</h2>
              <button onClick={handleReject} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">修正前</div>
                  <div className="p-4 bg-gray-50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                    {backupText}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">修正後</div>
                  <div className="p-4 bg-gray-50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                    {comparisonText}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={handleReject}
                className="flex items-center justify-center h-11 px-6 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                元に戻す
              </button>
              <button
                onClick={handleAccept}
                className="flex items-center justify-center h-11 px-6 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors text-sm font-medium"
              >
                <Check className="w-4 h-4 mr-2" />
                この内容でOK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT PANEL */}
      <section
        className={`
    w-full md:w-[520px] md:border-r border-gray-200 bg-white flex flex-col h-[100dvh]
    ${activeTab === "preview" ? "hidden md:flex" : "flex"}
  `}
      >
        <div className="flex-1 overflow-y-auto">
          <header className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FumiLogo />
            </div>
            <div className="flex items-center gap-2">
              {loadingMode && (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AIが考え中...</span>
                </div>
              )}
              {hasContent && !isLoading && (
                <button
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="入力内容をクリア"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </header>

          <div className="p-5 space-y-8 pb-24">

            {/* テーマ */}
            <div className="space-y-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">雰囲気を選ぶ</label>
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(THEMES) as ThemeType[]).map((t) => (
                  <>
                    {t === "custom" && (
                      <div key="divider" className="w-full h-0 md:w-px md:h-6 bg-gray-300 md:mx-1" />
                    )}
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      disabled={isLoading}
                      className={`
            py-2 px-2.5 text-sm rounded-full border transition-all font-medium
            ${theme === t
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                        }
          `}
                    >
                      {THEMES[t].name}
                    </button>
                  </>
                ))}
              </div>
            </div>

            {/* カスタム設定 */}
            {isCustomTheme && (
              <div className="space-y-5 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">フォント</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(FONTS) as FontType[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFont(f)}
                        disabled={isLoading}
                        className={`
                    py-1.5 px-3 text-sm rounded-full border transition-all
                    ${font === f
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                          }
                  `}
                      >
                        {FONTS[f].name}
                      </button>
                    ))}
                  </div>
                  {fontInfo.notice && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-3">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {fontInfo.notice}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">背景色</label>
                  <div className="flex gap-2">
                    {(Object.keys(BACKGROUNDS) as BackgroundType[]).map((b) => (
                      <button
                        key={b}
                        onClick={() => setBackground(b)}
                        disabled={isLoading}
                        title={BACKGROUNDS[b].name}
                        className={`
                    w-8 h-8 rounded-full border-2 transition-all
                    ${background === b
                            ? "border-gray-800 scale-110"
                            : "border-gray-300 hover:border-gray-400"
                          }
                  `}
                        style={{ backgroundColor: BACKGROUNDS[b].bgColor }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 見出し */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                タイトル
                <span className="text-gray-300 font-normal ml-1">任意</span>
              </label>
              <Input
                placeholder="お知らせ、ご報告 など"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                style={{ fontFamily: FONTS[font].fontFamily }}
                className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-xl h-11"
              />
            </div>

            {/* 本文 */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">本文</label>
              <Textarea
                placeholder="伝えたいことを書いてください"
                className="min-h-[320px] md:min-h-[240px] text-base leading-relaxed resize-none p-4 border-gray-200 focus:border-gray-400 focus:ring-0 rounded-xl"
                style={{ fontFamily: FONTS[font].fontFamily }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* AIに相談 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block mb-1.5 text-sm font-medium text-gray-700">AIに相談</label>
                {isLimitReached ? (
                  <p className="text-xs text-red-500">
                    本日の上限に達しました
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    残り {remainingCount}/{DAILY_LIMIT} 回
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAiFix('fix')}
                  disabled={loadingMode !== null || !text || isLimitReached}
                  className="flex-1 h-11 text-sm border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-full"
                >
                  {loadingMode === 'fix' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1.5" />
                  )}
                  {loadingMode === 'fix' ? "処理中..." : "誤字をチェック"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAiFix('polish')}
                  disabled={loadingMode !== null || !text || isLimitReached}
                  className="flex-1 h-11 text-sm border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-full"
                >
                  {loadingMode === 'polish' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1.5" />
                  )}
                  {loadingMode === 'polish' ? "処理中..." : "表現を整える"}
                </Button>
              </div>
            </div>

            {/* 日付・署名 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  日付
                  <span className="text-gray-300 font-normal ml-1">任意</span>
                </label>
                <Input
                  placeholder="20xx年1月1日"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isLoading}
                  style={{ fontFamily: FONTS[font].fontFamily }}
                  className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-xl h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  名前
                  <span className="text-gray-300 font-normal ml-1">任意</span>
                </label>
                <Input
                  placeholder="灰原 凪"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  disabled={isLoading}
                  style={{ fontFamily: FONTS[font].fontFamily }}
                  className="border-gray-200 focus:border-gray-400 focus:ring-0 rounded-xl h-11"
                />
              </div>
            </div>

            {/* フッター */}
            <div className="pt-12 md:pt-20 pb-8 pl-1 md:fixed md:bottom-6 md:left-6 md:pt-0 md:pb-0 md:pl-0">
              <div
                className="text-gray-800 font-semibold"
                style={{ fontFamily: 'var(--font-noto-serif)' }}
              >
                おしらせ画
              </div>
              <div className="text-sm text-gray-500 mt-1">白背景の文章画像をかんたん作成</div>
              <div className="text-xs text-gray-400 mt-4">
                Made with 🤍 by{' '}
                <a
                  href="https://nanataro.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:underline"
                >
                  なな太郎
                </a>
                {' · '}
                <a
                  href="https://x.com/nxouv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:underline"
                >
                  @nxouv
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* スマホ用フッター */}
        <div className="fixed bottom-2 left-4 right-4 md:hidden">
          <Button
            className="w-full h-12 bg-gray-800 hover:bg-gray-700 text-white text-base font-medium rounded-full shadow-lg"
            onClick={async () => {
              // フォントを強制的に読み込む
              const fontFamily = FONTS[font].fontFamily;
              const getFontName = (cssVar: string): string => {
                if (cssVar.includes('noto-serif')) return 'Noto Serif JP';
                if (cssVar.includes('mplus-rounded')) return 'M PLUS Rounded 1c';
                if (cssVar.includes('yomogi')) return 'Yomogi';
                return 'Noto Sans JP';
              };
              const actualFontName = getFontName(fontFamily);

              try {
                // フォントを複数サイズで読み込む
                await Promise.all([
                  document.fonts.load(`15px "${actualFontName}"`),
                  document.fonts.load(`17px "${actualFontName}"`),
                  document.fonts.load(`400 15px "${actualFontName}"`),
                  document.fonts.load(`500 15px "${actualFontName}"`),
                ]);

                // すべてのフォント読み込み完了を待つ
                await document.fonts.ready;

                // 読み込み完了後、レンダリングのために追加で待機
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (e) {
                console.log('Font preload:', e);
                // エラーでも続行
                await new Promise(resolve => setTimeout(resolve, 500));
              }

              setActiveTab("preview");
              window.scrollTo(0, 0);
            }}
            disabled={!text}
          >
            プレビューを見る
          </Button>
        </div>
      </section>


      {/* RIGHT PANEL */}
      <section
        className={`
    flex-1 bg-gray-100 relative flex-col h-[100dvh]
    ${activeTab === "editor" ? "hidden md:flex" : "flex"}
  `}
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="flex justify-center pb-24 md:pb-8">
            <PreviewCanvas
              text={text}
              theme={theme}
              font={font}
              background={background}
              title={title}
              date={date}
              signature={signature}
              isPreviewMode={activeTab === "preview"}
            />
          </div>
        </div>

        {/* スマホ用フッター（画面下に固定） */}
        <div className="fixed bottom-4 left-4 right-4 md:hidden">
          <Button
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 text-base font-medium rounded-full shadow-md"
            onClick={() => setActiveTab("editor")}
          >
            編集に戻る
          </Button>
        </div>
      </section>
    </main>
  );
}

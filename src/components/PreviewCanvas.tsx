'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ThemeType, FontType, BackgroundType, FONTS, BACKGROUNDS } from '@/lib/types';

interface PreviewCanvasProps {
    text: string;
    theme: ThemeType;
    font: FontType;
    background: BackgroundType;
    title: string;
    date: string;
    signature: string;
    isPreviewMode?: boolean;
}

const PAGE_WIDTH = 500;
const PADDING = 48;
const PADDING_LEFT = 55;
const PADDING_RIGHT = 48;
const CONTENT_WIDTH = PAGE_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const MAX_HEIGHT = 560;
const FONT_SIZE = 15;
const LINE_HEIGHT = 1.8;
const LINE_PIXEL_HEIGHT = FONT_SIZE * LINE_HEIGHT;
const PARAGRAPH_MARGIN = 20;
const TITLE_FONT_SIZE = 17;
const TITLE_MARGIN_BOTTOM = 24;

const LINE_START_PROHIBITED = `。、.,!?!?）」』】〉》〕］｝〙〗〟'"`;

interface PageContent {
    lines: string[];
    lineTypes: ('normal' | 'paragraph-start')[];
}

export default function PreviewCanvas({
    text,
    theme,
    font,
    background,
    title,
    date,
    signature,
    isPreviewMode = false,
}: PreviewCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pages, setPages] = useState<PageContent[]>([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveImageUrl, setSaveImageUrl] = useState<string>('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const fontStyle = FONTS[font];
    const bgStyle = BACKGROUNDS[background];

    // モバイル判定
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // テキストを行に分割し、ページに振り分ける
    useEffect(() => {
        const processText = async () => {
            if (!text.trim() && !title.trim()) {
                setPages([{ lines: [], lineTypes: [] }]);
                return;
            }

            // CSS変数から実際のフォント名を取得
            const getFontName = (cssVar: string): string => {
                if (cssVar.includes('noto-serif')) return '"Noto Serif JP"';
                if (cssVar.includes('mplus-rounded')) return '"M PLUS Rounded 1c"';
                if (cssVar.includes('yomogi')) return '"Yomogi"';
                return '"Noto Sans JP"';
            };

            const actualFontName = getFontName(fontStyle.fontFamily);

            // フォントがロードされるのを待つ
            try {
                await document.fonts.ready;
                await document.fonts.load(`${FONT_SIZE}px ${actualFontName}`);
            } catch (e) {
                console.log('Font loading:', e);
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.font = `${FONT_SIZE}px ${actualFontName}`;

            const paragraphs = text.split('\n');

            interface LineInfo {
                text: string;
                isParagraphStart: boolean;
            }

            const allLines: LineInfo[] = [];

            paragraphs.forEach((paragraph, pIndex) => {
                if (paragraph === '') {
                    allLines.push({ text: '', isParagraphStart: false });
                } else {
                    const wrappedLines = wrapText(ctx, paragraph, CONTENT_WIDTH);
                    wrappedLines.forEach((line, lIndex) => {
                        const isParagraphStart = lIndex === 0 && pIndex > 0 && paragraphs[pIndex - 1] === '';
                        allLines.push({ text: line, isParagraphStart });
                    });
                }
            });

            const filteredLines: LineInfo[] = [];
            let nextIsParagraphStart = false;

            for (const line of allLines) {
                if (line.text === '') {
                    nextIsParagraphStart = true;
                } else {
                    filteredLines.push({
                        text: line.text,
                        isParagraphStart: nextIsParagraphStart || line.isParagraphStart
                    });
                    nextIsParagraphStart = false;
                }
            }

            const newPages: PageContent[] = [];
            let currentPage: PageContent = { lines: [], lineTypes: [] };
            let currentY = 0;

            const titleOffset = title.trim() ? TITLE_FONT_SIZE + TITLE_MARGIN_BOTTOM : 0;
            let isFirstPage = true;

            for (let i = 0; i < filteredLines.length; i++) {
                const line = filteredLines[i];

                let lineHeight = LINE_PIXEL_HEIGHT;
                if (line.isParagraphStart && currentPage.lines.length > 0) {
                    lineHeight += PARAGRAPH_MARGIN;
                }

                const availableHeight = isFirstPage ? MAX_HEIGHT - titleOffset : MAX_HEIGHT;

                if (currentY + lineHeight > availableHeight && currentPage.lines.length > 0) {
                    newPages.push(currentPage);
                    currentPage = { lines: [], lineTypes: [] };
                    currentY = 0;
                    isFirstPage = false;
                    lineHeight = LINE_PIXEL_HEIGHT;
                }

                currentPage.lines.push(line.text);
                currentPage.lineTypes.push(line.isParagraphStart ? 'paragraph-start' : 'normal');
                currentY += lineHeight;
            }

            if (currentPage.lines.length > 0 || newPages.length === 0) {
                newPages.push(currentPage);
            }

            setPages(newPages);
        };

        processText();
    }, [text, title, font, fontStyle.fontFamily]);

    // スマホでプレビューモードになったら画像を生成
    const generatePreviewImages = useCallback(async () => {
        if (!isMobile || !isPreviewMode) return;

        setIsGenerating(true);
        const { toBlob } = await import('html-to-image');
        const images: string[] = [];

        // 少し待ってDOMが確実にレンダリングされるようにする
        await new Promise(resolve => setTimeout(resolve, 100));

        for (let i = 0; i < pages.length; i++) {
            const element = document.getElementById(`download-page-${i}`);
            if (!element) continue;

            try {
                const blob = await toBlob(element, {
                    pixelRatio: 2,
                    backgroundColor: bgStyle.bgColor,
                });

                if (blob) {
                    const url = URL.createObjectURL(blob);
                    images.push(url);
                }
            } catch (error) {
                console.error('Preview generation error:', error);
            }
        }

        // 古いURLを解放
        previewImages.forEach(url => URL.revokeObjectURL(url));
        setPreviewImages(images);
        setIsGenerating(false);
    }, [isMobile, isPreviewMode, pages, bgStyle.bgColor]);

    useEffect(() => {
        if (isMobile && isPreviewMode) {
            generatePreviewImages();
        }
    }, [isMobile, isPreviewMode, generatePreviewImages]);

    // コンポーネントのクリーンアップ
    useEffect(() => {
        return () => {
            previewImages.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    // テキストを指定幅で折り返す（禁則処理付き）
    function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const lines: string[] = [];
        let currentLine = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine.length > 0) {
                if (LINE_START_PROHIBITED.includes(char)) {
                    // 禁止文字の場合、1文字前で改行して禁止文字を含める
                    if (currentLine.length > 1) {
                        const lastChar = currentLine.slice(-1);
                        const lineWithoutLast = currentLine.slice(0, -1);
                        lines.push(lineWithoutLast);
                        currentLine = lastChar + char;
                    } else {
                        // currentLineが1文字しかない場合はそのまま含める
                        lines.push(testLine);
                        currentLine = '';
                    }
                } else {
                    lines.push(currentLine);
                    currentLine = char;
                }
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.filter(line => line.length > 0);
    }

    // ページの高さを計算
    function calculatePageHeight(page: PageContent, isFirstPage: boolean, hasTitle: boolean): number {
        if (page.lines.length === 0) {
            return 200;
        }

        let height = PADDING * 2;

        if (isFirstPage && hasTitle) {
            height += TITLE_FONT_SIZE + TITLE_MARGIN_BOTTOM;
        }

        for (let i = 0; i < page.lines.length; i++) {
            height += LINE_PIXEL_HEIGHT;
            if (page.lineTypes[i] === 'paragraph-start' && i > 0) {
                height += PARAGRAPH_MARGIN;
            }
        }

        if (date.trim() || signature.trim()) {
            height += 32;
        }

        return Math.min(height, MAX_HEIGHT + PADDING * 2);
    }

    // ファイル名を取得
    function getFileName(index?: number): string {
        let fileName = 'おしらせ画';

        if (title.trim()) {
            fileName += `_${title.trim()}`;
        }

        if (pages.length > 1 && index !== undefined) {
            fileName += `_${index + 1}`;
        }

        return `${fileName}.png`;
    }

    // 画像としてダウンロード
    const downloadImages = async () => {
        const { toBlob } = await import('html-to-image');

        for (let i = 0; i < pages.length; i++) {
            const element = document.getElementById(`download-page-${i}`);
            if (!element) continue;

            try {
                const blob = await toBlob(element, {
                    pixelRatio: 2,
                    backgroundColor: bgStyle.bgColor,
                });

                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = getFileName(i);
                    a.click();
                    URL.revokeObjectURL(url);
                }
            } catch (error) {
                console.error('Download error:', error);
            }
        }
    };

    // 共有（モバイル用）
    const shareImage = async (): Promise<boolean> => {
        const { toBlob } = await import('html-to-image');
        const element = document.getElementById('download-page-0');
        if (!element) return false;

        try {
            const blob = await toBlob(element, {
                pixelRatio: 2,
                backgroundColor: bgStyle.bgColor,
            });

            if (!blob) return false;

            const file = new File([blob], getFileName(0), { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file] });
                return true;
            }

            return false;
        } catch (error) {
            console.error('Share error:', error);
            return false;
        }
    };

    // iOS用のモーダル表示
    const showImageModal = async () => {
        const { toBlob } = await import('html-to-image');
        const element = document.getElementById('download-page-0');
        if (!element) return;

        try {
            const blob = await toBlob(element, {
                pixelRatio: 2,
                backgroundColor: bgStyle.bgColor,
            });

            if (blob) {
                const url = URL.createObjectURL(blob);
                setSaveImageUrl(url);
                setShowSaveModal(true);
            }
        } catch (error) {
            console.error('Image generation error:', error);
        }
    };

    // モーダルを閉じる
    const closeSaveModal = () => {
        if (saveImageUrl) {
            URL.revokeObjectURL(saveImageUrl);
        }
        setSaveImageUrl('');
        setShowSaveModal(false);
    };

    // 保存ボタンの処理
    const handleSave = async () => {
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);

        if (isIOS) {
            const shared = await shareImage();
            if (!shared) {
                showImageModal();
            }
        } else if (isAndroid && navigator.share) {
            const shared = await shareImage();
            if (!shared) {
                downloadImages();
            }
        } else {
            downloadImages();
        }
    };

    const hasTitle = title.trim().length > 0;

    // ページの内容をレンダリングする関数
    const renderPageContent = (page: PageContent, pageIndex: number, isFirstPage: boolean, isLastPage: boolean) => (
        <>
            {isFirstPage && hasTitle && (
                <div
                    style={{
                        fontSize: TITLE_FONT_SIZE,
                        marginBottom: TITLE_MARGIN_BOTTOM,
                        textAlign: 'center',
                    }}
                >
                    {title}
                </div>
            )}

            <div style={{ fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT }}>
                {page.lines.length > 0 ? (
                    page.lines.map((line, lineIndex) => (
                        <div
                            key={lineIndex}
                            style={{
                                marginTop: page.lineTypes[lineIndex] === 'paragraph-start' && lineIndex > 0
                                    ? PARAGRAPH_MARGIN
                                    : 0,
                            }}
                        >
                            {line}
                        </div>
                    ))
                ) : (
                    <div style={{ color: `${bgStyle.textColor}66` }}>
                        伝えたいことを書いてください
                    </div>
                )}
            </div>

            {isLastPage && (date.trim() || signature.trim()) && (
                <div
                    style={{
                        marginTop: 24,
                        fontSize: FONT_SIZE,
                        textAlign: 'right',
                    }}
                >
                    {date.trim() && <div>{date}</div>}
                    {signature.trim() && <div>{signature}</div>}
                </div>
            )}
        </>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <span className="text-sm text-gray-500">プレビュー</span>
                <button
                    onClick={handleSave}
                    className="flex items-center h-10 px-5 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors text-sm"
                >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    保存する
                </button>
            </div>

            {/* プレビュー（表示用） */}
            <div ref={containerRef} className="flex-1 overflow-y-auto">
                {/* スマホ：画像表示 */}
                {isMobile && isPreviewMode && (
                    <div className="flex flex-col gap-4">
                        {/* フォント表示の注意（手書き系フォント選択時のみ） */}
                        {(theme === 'cute' || (theme === 'custom' && font === 'handwriting')) && (
                            <div className="text-xs text-gray-500 text-center px-4 mb-6">
                                <p className="font-medium text-gray-600 mb-1">
                                    「かわいい」「手書き」フォントは一部の漢字が正しく表示されない場合があります
                                </p>
                                <p>
                                    その場合は「編集に戻る」→「プレビューを見る」をお試しください
                                </p>
                            </div>
                        )}

                        {isGenerating ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-gray-500 text-sm">読み込み中...</div>
                            </div>
                        ) : (
                            previewImages.map((imageUrl, index) => (
                                <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`プレビュー ${index + 1}`}
                                    className="shadow-lg w-full select-none"
                                    style={{
                                        maxWidth: PAGE_WIDTH,
                                        margin: '0 auto',
                                        WebkitUserSelect: 'none',
                                        userSelect: 'none',
                                        WebkitTouchCallout: 'none',
                                    }}
                                    draggable={false}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* PC：HTML表示（リアルタイム） */}
                {(!isMobile || !isPreviewMode) && (
                    <div className="flex flex-col gap-4">
                        {pages.map((page, pageIndex) => {
                            const isFirstPage = pageIndex === 0;
                            const isLastPage = pageIndex === pages.length - 1;
                            const pageHeight = pages.length === 1
                                ? calculatePageHeight(page, isFirstPage, hasTitle)
                                : MAX_HEIGHT + PADDING * 2;

                            return (
                                <div
                                    key={pageIndex}
                                    className="shadow-md shrink-0"
                                    style={{
                                        width: PAGE_WIDTH,
                                        minHeight: pageHeight,
                                        backgroundColor: bgStyle.bgColor,
                                        color: bgStyle.textColor,
                                        fontFamily: fontStyle.fontFamily,
                                        padding: `${PADDING}px ${PADDING_RIGHT}px ${PADDING}px ${PADDING_LEFT}px`,
                                        boxSizing: 'border-box',
                                        lineBreak: 'strict',
                                        wordBreak: 'break-all',
                                        margin: '0 auto',
                                    }}
                                >
                                    {renderPageContent(page, pageIndex, isFirstPage, isLastPage)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ダウンロード用の非表示要素 */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                {pages.map((page, pageIndex) => {
                    const isFirstPage = pageIndex === 0;
                    const isLastPage = pageIndex === pages.length - 1;
                    const pageHeight = pages.length === 1
                        ? calculatePageHeight(page, isFirstPage, hasTitle)
                        : MAX_HEIGHT + PADDING * 2;

                    return (
                        <div
                            key={pageIndex}
                            id={`download-page-${pageIndex}`}
                            style={{
                                width: PAGE_WIDTH,
                                minHeight: pageHeight,
                                backgroundColor: bgStyle.bgColor,
                                color: bgStyle.textColor,
                                fontFamily: fontStyle.fontFamily,
                                padding: `${PADDING}px ${PADDING_RIGHT}px ${PADDING}px ${PADDING_LEFT}px`,
                                boxSizing: 'border-box',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                            }}
                        >
                            {renderPageContent(page, pageIndex, isFirstPage, isLastPage)}
                        </div>
                    );
                })}
            </div>

            {/* iOS用保存モーダル */}
            {showSaveModal && (
                <div
                    className="fixed inset-0 bg-gray-100 z-50 flex flex-col"
                    onClick={closeSaveModal}
                >
                    {/* ヘッダー */}
                    <div className="flex items-center justify-center p-4 bg-white border-b border-gray-200">
                        <span className="text-sm text-gray-500">画像を保存</span>
                    </div>

                    {/* 説明 */}
                    <div className="px-4 py-3 bg-white border-b border-gray-100">
                        <p className="text-sm text-gray-600 text-center">
                            下の画像を<strong>長押し</strong>して「写真に追加」を選択してください
                        </p>
                    </div>

                    {/* 画像 */}
                    <div
                        className="flex-1 overflow-auto p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center">
                            <img
                                src={saveImageUrl}
                                alt="保存する画像"
                                className="shadow-lg select-none"
                                style={{
                                    maxWidth: '100%',
                                    WebkitUserSelect: 'none',
                                    userSelect: 'none',
                                    WebkitTouchCallout: 'default',
                                }}
                                draggable={false}
                            />
                        </div>
                    </div>

                    {/* フッター */}
                    <div className="fixed bottom-4 left-4 right-4">
                        <button
                            onClick={closeSaveModal}
                            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 text-base font-medium rounded-full shadow-md"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

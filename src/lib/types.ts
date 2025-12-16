export type ThemeType = "formal" | "simple" | "soft" | "cute" | "custom";

export type FontType = "gothic" | "mincho" | "rounded" | "handwriting";

export type BackgroundType = "white" | "gray" | "pink" | "blue" | "dark";

export interface ThemeStyle {
    id: ThemeType;
    name: string;
    description: string;
    defaultFont: FontType;
    defaultBackground: BackgroundType;
    isCustom?: boolean;
}

export interface FontStyle {
    id: FontType;
    name: string;
    cssVariable: string;
    fontFamily: string; // Canvas用のフォント名
    notice?: string;
}

export interface BackgroundStyle {
    id: BackgroundType;
    name: string;
    bgColor: string;
    textColor: string;
}

// テーマ定義（フォーマルを最初に）
export const THEMES: Record<ThemeType, ThemeStyle> = {
    formal: {
        id: "formal",
        name: "フォーマル",
        description: "謝罪、公式発表など",
        defaultFont: "mincho",
        defaultBackground: "white",
    },
    simple: {
        id: "simple",
        name: "シンプル",
        description: "お知らせ、報告など汎用的に",
        defaultFont: "gothic",
        defaultBackground: "white",
    },
    soft: {
        id: "soft",
        name: "やさしい",
        description: "ファンへの報告、個人的なお知らせなど",
        defaultFont: "rounded",
        defaultBackground: "white",
    },
    cute: {
        id: "cute",
        name: "かわいい",
        description: "親しみやすい、カジュアルなお知らせなど",
        defaultFont: "handwriting",
        defaultBackground: "white",
    },
    custom: {
        id: "custom",
        name: "カスタム",
        description: "自分で設定する",
        defaultFont: "gothic",
        defaultBackground: "white",
        isCustom: true,
    },
};

// フォント定義
export const FONTS: Record<FontType, FontStyle> = {
    mincho: {
        id: "mincho",
        name: "明朝",
        cssVariable: "var(--font-noto-serif)",
        fontFamily: "'Noto Serif JP', serif",
    },
    gothic: {
        id: "gothic",
        name: "ゴシック",
        cssVariable: "var(--font-noto-sans)",
        fontFamily: "'Noto Sans JP', sans-serif",
    },
    rounded: {
        id: "rounded",
        name: "丸ゴシック",
        cssVariable: "var(--font-mplus-rounded)",
        fontFamily: "'M PLUS Rounded 1c', sans-serif",
    },
    handwriting: {
        id: "handwriting",
        name: "手書き",
        fontFamily: "var(--font-yomogi)",
        notice: "難しい漢字は表示されないことがあります",
    },
};


// 背景色定義
export const BACKGROUNDS: Record<BackgroundType, BackgroundStyle> = {
    white: {
        id: "white",
        name: "白",
        bgColor: "#FFFFFF",
        textColor: "#171717",
    },
    gray: {
        id: "gray",
        name: "グレー",
        bgColor: "#F5F5F5",
        textColor: "#171717",
    },
    pink: {
        id: "pink",
        name: "ピンク",
        bgColor: "#FDF2F5",
        textColor: "#4A3F42",
    },
    blue: {
        id: "blue",
        name: "ブルー",
        bgColor: "#F2F6FB",
        textColor: "#3F444A",
    },
    dark: {
        id: "dark",
        name: "ダーク",
        bgColor: "#1a1a1a",
        textColor: "#FFFFFF",
    },
};
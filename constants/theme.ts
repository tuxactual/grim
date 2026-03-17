import { Platform } from "react-native";

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const baseThemes = {
  teslaDark: {
    id: "tesla-dark",
    colors: {
      background: "#0B0D0E",
      surface: "#15191B",
      textPrimary: "#F4F4F4",
      textSecondary: "#A9B3AE",
      textMuted: "#7D8882",
      separator: "rgba(255,255,255,0.08)",
      borderStrong: "rgba(255,255,255,0.16)",
      overlay: "rgba(0, 0, 0, 0.52)",
      onAccent: "#120910",
    },
  },
} as const;

export const accentThemes = {
  wicked: {
    id: "wicked",
    colors: {
      accent: "#FF4FA3",
      accentSoft: "#FF7DBB",
      quoteAccent: "#FF9BC9",
      income: "#3BD18A",
      expense: "#FF6A6A",
      highlightTransparent: "rgba(255, 79, 163, 0)",
      highlight: "rgba(255, 79, 163, 0.14)",
      dangerSoft: "rgba(255, 106, 106, 0.12)",
    },
  },
} as const;

export function createTheme(
  baseTheme = baseThemes.teslaDark,
  accentTheme = accentThemes.wicked,
) {
  return {
    id: `${baseTheme.id}:${accentTheme.id}`,
    baseTheme,
    accentTheme,
    colors: {
      ...baseTheme.colors,
      ...accentTheme.colors,
    },
    fonts: Fonts,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    radius: {
      sm: 8,
      md: 16,
      lg: 32,
    },
    typography: {
      title: 24,
      subtitle: 20,
      body: 17,
      caption: 14,
    },
    layout: {
      screenPadding: 20,
      rowInset: 20,
      rowAmountWidth: 112,
      fabRight: 24,
      fabBottom: 34,
    },
  } as const;
}

export const theme = createTheme();

export const Colors = {
  light: {
    text: theme.colors.textPrimary,
    background: theme.colors.background,
    tint: theme.colors.accent,
    icon: theme.colors.textSecondary,
    tabIconDefault: theme.colors.textSecondary,
    tabIconSelected: theme.colors.accent,
  },
  dark: {
    text: theme.colors.textPrimary,
    background: theme.colors.background,
    tint: theme.colors.accent,
    icon: theme.colors.textSecondary,
    tabIconDefault: theme.colors.textSecondary,
    tabIconSelected: theme.colors.accent,
  },
} as const;

export type AppTheme = typeof theme;

export const AEGIS_THEME_STORAGE_KEY = "aegis-theme";

export type AegisTheme = {
  accent: string;
  accentDim: string;
  muted: string;
  background: string;
};

export const DEFAULT_AEGIS_THEME: AegisTheme = {
  accent: "#39ff14",
  accentDim: "#6fdc5c",
  muted: "#3a5c3a",
  background: "#000000",
};

export const THEME_PRESETS: Record<string, AegisTheme> = {
  default: { ...DEFAULT_AEGIS_THEME },
  amber: {
    accent: "#ffb000",
    accentDim: "#ffcc66",
    muted: "#5c4a2a",
    background: "#0a0804",
  },
  cyan: {
    accent: "#00e5ff",
    accentDim: "#66f0ff",
    muted: "#2a4a5c",
    background: "#000608",
  },
  rose: {
    accent: "#ff4d8d",
    accentDim: "#ff8cb8",
    muted: "#5c2a40",
    background: "#080408",
  },
};

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isValidHex(s: string): boolean {
  return HEX.test(s.trim());
}

export function parseStoredTheme(raw: string | null): Partial<AegisTheme> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const out: Partial<AegisTheme> = {};
    for (const k of ["accent", "accentDim", "muted", "background"] as const) {
      const x = o[k];
      if (typeof x === "string" && isValidHex(x)) out[k] = x.trim();
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

export function mergeTheme(partial: Partial<AegisTheme> | null): AegisTheme {
  return {
    ...DEFAULT_AEGIS_THEME,
    ...(partial ?? {}),
  };
}

export function applyAegisThemeToDocument(theme: AegisTheme): void {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  r.style.setProperty("--aegis-accent", theme.accent);
  r.style.setProperty("--aegis-accent-dim", theme.accentDim);
  r.style.setProperty("--aegis-muted", theme.muted);
  r.style.setProperty("--aegis-bg", theme.background);
}

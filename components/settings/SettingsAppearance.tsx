"use client";

import { useAegisTheme } from "@/components/ThemeProvider";
import {
  DEFAULT_AEGIS_THEME,
  isValidHex,
  THEME_PRESETS,
  type AegisTheme,
} from "@/lib/aegis-theme";
import { useEffect, useState } from "react";

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs text-aegis-lime-dim">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          type="color"
          value={value.length === 7 ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-14 cursor-pointer border border-aegis-lime/50 bg-black p-0"
          aria-label={`${label} picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          maxLength={7}
          className="min-w-[7rem] flex-1 border border-aegis-lime/60 bg-black px-2 py-1 font-mono text-sm text-aegis-lime"
          aria-label={`${label} hex`}
        />
      </div>
    </div>
  );
}

export function SettingsAppearance() {
  const { theme, setTheme } = useAegisTheme();
  const [draft, setDraft] = useState<AegisTheme>(theme);

  useEffect(() => {
    setDraft(theme);
  }, [theme]);

  function patch(partial: Partial<AegisTheme>) {
    setDraft((d) => ({ ...d, ...partial }));
  }

  function applyDraft() {
    const next: AegisTheme = {
      accent: isValidHex(draft.accent) ? draft.accent.trim() : theme.accent,
      accentDim: isValidHex(draft.accentDim) ? draft.accentDim.trim() : theme.accentDim,
      muted: isValidHex(draft.muted) ? draft.muted.trim() : theme.muted,
      background: isValidHex(draft.background)
        ? draft.background.trim()
        : theme.background,
    };
    setTheme(next);
    setDraft(next);
  }

  function applyPreset(key: string) {
    const p = THEME_PRESETS[key];
    if (!p) return;
    setTheme({ ...p });
    setDraft({ ...p });
  }

  function resetDefault() {
    setTheme({ ...DEFAULT_AEGIS_THEME });
    setDraft({ ...DEFAULT_AEGIS_THEME });
  }

  const dirty =
    draft.accent !== theme.accent ||
    draft.accentDim !== theme.accentDim ||
    draft.muted !== theme.muted ||
    draft.background !== theme.background;

  return (
    <section className="space-y-4 border border-aegis-lime/40 bg-black/40 p-4">
      <h2 className="border-b border-aegis-lime/30 pb-2 font-mono text-sm text-aegis-lime-dim">
        &gt; appearance
      </h2>
      <p className="font-mono text-xs text-aegis-lime-dim/90">
        Accent and background apply across the dashboard. Saved in this browser only.
      </p>

      <div className="flex flex-wrap gap-2">
        <span className="self-center font-mono text-xs text-aegis-muted">presets</span>
        {Object.keys(THEME_PRESETS).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            className="border border-aegis-lime/50 px-2 py-1 font-mono text-xs text-aegis-lime hover:bg-aegis-lime/10"
          >
            [ {key} ]
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField id="th-accent" label="accent" value={draft.accent} onChange={(v) => patch({ accent: v })} />
        <ColorField
          id="th-accentDim"
          label="accent_dim"
          value={draft.accentDim}
          onChange={(v) => patch({ accentDim: v })}
        />
        <ColorField id="th-muted" label="muted" value={draft.muted} onChange={(v) => patch({ muted: v })} />
        <ColorField
          id="th-bg"
          label="background"
          value={draft.background}
          onChange={(v) => patch({ background: v })}
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={applyDraft}
          disabled={!dirty}
          className="border border-aegis-lime px-3 py-1 font-mono text-sm text-aegis-lime hover:bg-aegis-lime/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          [ apply ]
        </button>
        <button
          type="button"
          onClick={resetDefault}
          className="border border-aegis-lime-dim/50 px-3 py-1 font-mono text-sm text-aegis-lime-dim hover:bg-aegis-lime/10"
        >
          [ reset_default ]
        </button>
      </div>
    </section>
  );
}

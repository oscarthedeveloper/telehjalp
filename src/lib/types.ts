export type Settings = {
  siteIntro: string;
  protonPassUrl: string;
  claudeUrl: string;
  aiDeviceInfo: string;
  aiClosing: string;
};

export type Solution = {
  /** Används i adressen: /hjalp/<nod>/<denna> */
  slug: string;
  title: string;
  cause?: string | null;
  steps: string[];
  needsPassword?: boolean;
  passwordHint?: string | null;
  published?: boolean;
};

export type Node = {
  /** Måste vara unikt i hela trädet. Används i adressen: /hjalp/<denna> */
  slug: string;
  label: string;
  icon?: string | null;
  heading?: string | null;
  intro?: string | null;
  published?: boolean;
  children?: Node[];
  solutions?: Solution[];
};

export type Content = {
  settings: Settings;
  nodes: Node[];
};

export const DEFAULT_SETTINGS: Settings = {
  siteIntro: "Tryck på det du har besvär med.",
  protonPassUrl: "protonpass://",
  claudeUrl: "https://claude.ai/new",
  aiDeviceInfo: "",
  aiClosing:
    "Viktigt: jag är pensionär. Svara på svenska med korta numrerade steg, ett steg i taget. " +
    "Använd enkla ord och inga tekniska facktermer. Skriv exakt vad jag ska trycka på och var på skärmen jag hittar det.",
};

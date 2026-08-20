import { ProgrammingLanguage } from "./programming-language.enum";

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
}

export interface CodeChangePayload {
  roomId: string;
  code: string;
}

export interface CodeUpdateEvent {
  code: string;
}

export enum FocusEventType {
  MOUSE_LEAVE = 'mouse_leave',
  TAB_HIDDEN = 'tab_hidden',
  WINDOW_BLUR = 'window_blur'
}

export enum ClipboardEventType {
  COPY = 'copy',
  PASTE = 'paste',
  COPY_BLOCKED = 'copy_blocked',
  PASTE_BLOCKED = 'paste_blocked'
}

export const languageKeywordsMap: Record<string, ProgrammingLanguage> = {
  javascript: ProgrammingLanguage.JAVASCRIPT,
  js: ProgrammingLanguage.JAVASCRIPT,
  typescript: ProgrammingLanguage.TYPESCRIPT,
  ts: ProgrammingLanguage.TYPESCRIPT,
  python: ProgrammingLanguage.PYTHON,
  py: ProgrammingLanguage.PYTHON,
  java: ProgrammingLanguage.JAVA,
  'c#': ProgrammingLanguage.CSHARP,
  csharp: ProgrammingLanguage.CSHARP,
  dotnet: ProgrammingLanguage.CSHARP,
  'c++': ProgrammingLanguage.CPP,
  cpp: ProgrammingLanguage.CPP,
  sql: ProgrammingLanguage.SQL
};
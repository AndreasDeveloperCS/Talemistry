export interface JoinRoomPayload {
  roomId: string;
  userId: string;
}

export interface CodeChangePayload {
  roomId: string;
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
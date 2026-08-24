import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import io from "socket.io-client";
import { environment } from "../../../../environments/environment";
import { CandidateUserProfile } from "../models/candidate-user-profile";

type Socket = ReturnType<typeof io>;

@Injectable({ providedIn: "root" })
export class CVParserGateway implements OnDestroy {

  private socket?: Socket;
  private roomId?: string;

  // ✅ connection state (this can stay BehaviorSubject)
  private connected$ = new BehaviorSubject<boolean>(false);

  // ✅ event streams (NO BehaviorSubject here)
  private uploaded$ = new Subject<void>();
  private parsing$ = new Subject<void>();
  private aiProcessing$ = new Subject<void>();
  private finalizing$ = new Subject<void>();
  private parsedCV$ = new Subject<CandidateUserProfile>();
  private error$ = new Subject<void>();

  // =========================
  // 🔧 HELPERS
  // =========================

  private normalizeSocketBase(value: unknown): string {
    try {
      const raw = String(value ?? '').trim();
      if (!raw) return '';

      if (/^https?:\/\//i.test(raw)) {
        return new URL(raw).origin.replace(/\/+$/, '');
      }

      if (typeof window !== 'undefined' && window?.location?.origin) {
        return new URL(raw, window.location.origin).origin.replace(/\/+$/, '');
      }

      return raw.replace(/\/+$/, '');
    } catch {
      return String(value ?? '').trim().replace(/\/+$/, '');
    }
  }

  private readAuthToken(explicitToken?: string): string | undefined {
    const provided = String(explicitToken ?? '').trim();
    if (provided) return provided;

    try {
      const userId = String(sessionStorage.getItem(`${environment.storage.userId}`) ?? '').trim();

      const byUserId = userId
        ? String(sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`) ?? '').trim()
        : '';

      const direct = String(sessionStorage.getItem(`${environment.storage.token}`) ?? '').trim();

      return byUserId || direct || undefined;
    } catch {
      return undefined;
    }
  }

  // =========================
  // 🔌 CONNECT
  // =========================

  connect(token?: string) {
    if (this.socket?.connected) return;

    // cleanup previous socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }

    const sameOriginBase =
      typeof window !== 'undefined' && window?.location?.origin
        ? window.location.origin
        : '';

    const base = this.normalizeSocketBase(environment.wsBase || sameOriginBase);
    const rawPath = environment.wsPath || 'socket.io';
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const authToken = this.readAuthToken(token);

    this.socket = io(`${base}/ws/cvparser`, {
      path,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      auth: authToken ? { token: authToken } : undefined
    });

    // =========================
    // 🎧 SOCKET EVENTS
    // =========================

    this.socket.on("connect", () => {
      console.log('Socket connected');
      this.connected$.next(true);

      if (this.roomId) {
        this.joinRoom(this.roomId);
      }
    });

    this.socket.on("disconnect", () => {
      console.log('Socket disconnected');
      this.connected$.next(false);
    });

    this.socket.on("connect_error", (err: any) => {
      console.error("Socket connect error:", err);
    });

    this.socket.on("reconnect", () => {
      console.log('Socket reconnected');

      if (this.roomId) {
        this.joinRoom(this.roomId);
      }
    });

    // =========================
    // 🚀 PROCESS EVENTS
    // =========================

    this.socket.on("uploaded", () => {
      console.log('CV Parser Gateway UPLOADED');
      this.uploaded$.next();
    });

    this.socket.on("parsing", () => {
      console.log('CV Parser Gateway PARSING');
      this.parsing$.next();
    });

    this.socket.on("ai-processing", () => {
      console.log('CV Parser Gateway AI PROCESSING');
      this.aiProcessing$.next();
    });

    this.socket.on("finalizing", () => {
      console.log('CV Parser Gateway FINALIZING');
      this.finalizing$.next();
    });

    this.socket.on("parsed-cv", (data: CandidateUserProfile) => {
      console.log('CV Parser Gateway PARSED CV', data);
      this.parsedCV$.next(data);
    });

    this.socket.on("error", () => {
      console.error('CV Parser Gateway ERROR');
      this.error$.next();
    });
  }

  // =========================
  // 🏠 ROOMS
  // =========================

  joinRoom(roomId: string) {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }

    this.roomId = roomId;
    console.log('Join Room:', roomId);

    this.socket.emit("join-room", { roomId });
  }

  leaveRoom() {
    if (!this.socket || !this.roomId) return;

    console.log('Leave Room:', this.roomId);

    this.socket.emit("leave-room", { roomId: this.roomId });
    this.roomId = undefined;
  }

  // =========================
  // 📡 OBSERVABLES
  // =========================

  onUploaded(): Observable<void> {
    return this.uploaded$.asObservable();
  }

  onParsing(): Observable<void> {
    return this.parsing$.asObservable();
  }

  onAiProcessing(): Observable<void> {
    return this.aiProcessing$.asObservable();
  }

  onFinalizing(): Observable<void> {
    return this.finalizing$.asObservable();
  }

  onParsedCV(): Observable<CandidateUserProfile> {
    return this.parsedCV$.asObservable();
  }

  onError(): Observable<void> {
    return this.error$.asObservable();
  }

  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  // =========================
  // 🧹 CLEANUP
  // =========================

  disconnect() {
    this.leaveRoom();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }

    this.connected$.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
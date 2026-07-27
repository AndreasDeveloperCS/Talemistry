"use client"

import { useEffect, useRef, useState } from "react"
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
  Code2,
  ClipboardList,
  Send,
  Play,
  Circle,
} from "lucide-react"
import { Avatar, Button } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"
import type { Interview } from "@/lib/data"

type Tab = "guide" | "code" | "chat" | "score"

const GUIDE = [
  { q: "Walk me through the architecture of a complex frontend feature you owned end to end.", competency: "Technical depth", min: 8 },
  { q: "How do you approach accessibility when building component systems?", competency: "Accessibility", min: 6 },
  { q: "Describe a time you mentored an engineer through a hard problem.", competency: "Leadership", min: 6 },
  { q: "How do you balance velocity with long-term maintainability?", competency: "Judgment", min: 5 },
]

const STARTER_CODE = `// Live coding — implement debounce
// The candidate edits here in real time.
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

const log = debounce((v) => console.log(v), 300);
`

export function InterviewRoom({ interview }: { interview: Interview }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [camOn, setCamOn] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [tab, setTab] = useState<Tab>(interview.type === "Live Coding" ? "code" : "guide")
  const [code, setCode] = useState(STARTER_CODE)
  const [output, setOutput] = useState<string>("")
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([
    { from: interview.interviewers[0], text: "Welcome! We'll start with a short intro." },
  ])
  const [draft, setDraft] = useState("")
  const [scores, setScores] = useState<Record<number, number>>({})

  // Local camera preview via getUserMedia (functional WebRTC shell).
  useEffect(() => {
    let stream: MediaStream | null = null
    async function toggle() {
      if (camOn && navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          if (videoRef.current) videoRef.current.srcObject = stream
        } catch {
          setCamOn(false)
        }
      }
    }
    toggle()
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [camOn])

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0")
  const ss = String(elapsed % 60).padStart(2, "0")

  function runCode() {
    const logs: string[] = []
    try {
      // Sandbox-ish eval for the demo editor only.
      const fn = new Function("console", `${code}\n; log("hello");`)
      fn({ log: (...a: unknown[]) => logs.push(a.join(" ")) })
      setOutput(logs.join("\n") || "// no console output")
    } catch (e) {
      setOutput(String(e))
    }
  }

  function send() {
    if (!draft.trim()) return
    setMessages((m) => [...m, { from: "You", text: draft.trim() }])
    setDraft("")
  }

  return (
    <div className="grid h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[1fr_400px]">
      {/* Stage */}
      <div className="flex flex-col bg-[#08131e]">
        <div className="flex items-center justify-between px-5 py-3 text-white">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{interview.type} · {interview.candidateName}</span>
            {recording ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-[#ff8a89]">
                <Circle className="h-2 w-2 fill-current" /> REC
              </span>
            ) : null}
          </div>
          <span className="font-mono text-sm text-[#8ea0b5]">{mm}:{ss}</span>
        </div>

        <div className="relative flex flex-1 items-center justify-center p-4">
          {/* Remote (candidate) tile */}
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-[#0b1b2a]">
            <Avatar name={interview.candidateName} size={96} className="text-2xl" tone="#208e2d" />
            <p className="mt-3 text-sm font-medium text-white">{interview.candidateName}</p>
            <p className="text-xs text-[#8ea0b5]">Waiting for candidate to join…</p>
          </div>

          {/* Local self-view */}
          <div className="absolute bottom-6 right-6 h-32 w-48 overflow-hidden rounded-xl border border-white/10 bg-black shadow-xl">
            {camOn ? (
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-[#8ea0b5]">
                <VideoOff className="h-6 w-6" />
                <span className="mt-1 text-xs">Camera off</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 border-t border-white/10 py-4">
          <ControlBtn active={micOn} onClick={() => setMicOn((v) => !v)} on={<Mic />} off={<MicOff />} />
          <ControlBtn active={camOn} onClick={() => setCamOn((v) => !v)} on={<VideoIcon />} off={<VideoOff />} />
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Share screen">
            <MonitorUp className="h-5 w-5" />
          </button>
          <button
            onClick={() => setRecording((v) => !v)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition",
              recording ? "bg-destructive text-white" : "bg-white/10 text-white hover:bg-white/20",
            )}
          >
            <Circle className={cn("h-3 w-3", recording && "fill-current")} />
            {recording ? "Stop" : "Record"}
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-white transition hover:opacity-90" aria-label="End call">
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Side panel */}
      <div className="flex flex-col border-l border-border bg-card">
        <div className="flex border-b border-border">
          <TabBtn active={tab === "guide"} onClick={() => setTab("guide")} icon={<ClipboardList className="h-4 w-4" />} label="Guide" />
          <TabBtn active={tab === "code"} onClick={() => setTab("code")} icon={<Code2 className="h-4 w-4" />} label="Code" />
          <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={<MessageSquare className="h-4 w-4" />} label="Chat" />
          <TabBtn active={tab === "score"} onClick={() => setTab("score")} icon={<ClipboardList className="h-4 w-4" />} label="Score" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "guide" ? (
            <ol className="space-y-4">
              {GUIDE.map((g, i) => (
                <li key={i} className="rounded-lg border border-border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">{g.competency}</span>
                    <span className="text-xs text-muted-foreground">weight {g.min}</span>
                  </div>
                  <p className="text-sm text-foreground">{g.q}</p>
                </li>
              ))}
            </ol>
          ) : null}

          {tab === "code" ? (
            <div className="flex h-full flex-col">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">shared-editor.js · synced</span>
                <Button size="sm" onClick={runCode}><Play className="h-3.5 w-3.5" />Run</Button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="min-h-[240px] flex-1 rounded-lg border border-border bg-[#0b1b2a] p-3 font-mono text-xs leading-relaxed text-[#d6e2f0] outline-none focus:ring-2 focus:ring-ring/40"
              />
              <div className="mt-2 rounded-lg bg-muted p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Console</p>
                <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">{output || "// Run to see output"}</pre>
              </div>
            </div>
          ) : null}

          {tab === "chat" ? (
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", m.from === "You" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                    <p className="mb-0.5 text-[10px] font-semibold opacity-70">{m.from}</p>
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) send()
                  }}
                  placeholder="Message…"
                  className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
                <Button size="icon" onClick={send} aria-label="Send"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : null}

          {tab === "score" ? (
            <div className="space-y-4">
              {GUIDE.map((g, i) => (
                <div key={i}>
                  <p className="mb-2 text-sm font-medium text-foreground">{g.competency}</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setScores((s) => ({ ...s, [i]: n }))}
                        className={cn(
                          "h-8 w-8 rounded-md text-sm font-medium transition",
                          scores[i] >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <textarea
                placeholder="Overall notes and recommendation…"
                className="min-h-[100px] w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
              <Button className="w-full">Submit scorecard</Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ControlBtn({
  active,
  onClick,
  on,
  off,
}: {
  active: boolean
  onClick: () => void
  on: React.ReactNode
  off: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full transition [&_svg]:h-5 [&_svg]:w-5",
        active ? "bg-white/10 text-white hover:bg-white/20" : "bg-destructive text-white",
      )}
    >
      {active ? on : off}
    </button>
  )
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition",
        active ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  )
}

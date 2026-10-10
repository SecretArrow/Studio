/**
 * Whiteboard templates — each template builds REAL board elements (stickies,
 * shapes, connectors, frames) relative to an origin point. Inserting a
 * template simply appends the produced elements to the document, so they stay
 * fully editable afterwards.
 */

import type { ConnectorElement, DesignElement, FrameElement, ShapeElement, StickyElement, TextElement } from "@/lib/design/types"
import { createConnector, createShape, createSticky, createText, uid } from "@/lib/design/types"
import { FRAME_DEFAULTS } from "./board-render"

export interface BoardTemplate {
  id: string
  name: string
  description: string
  /** preview box aspect (w/h) for the dialog card */
  aspect: number
  build(origin: { x: number; y: number }): DesignElement[]
}

/** Bottom-center of `a` → top-center of `b`, stored as a bound connector. */
function verticalConnector(a: DesignElement, b: DesignElement): ConnectorElement {
  const x1 = a.x + a.width / 2
  const y1 = a.y + a.height
  const x2 = b.x + b.width / 2
  const y2 = b.y
  return createConnector({
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    points: [x1, y1, x2, y2],
    fromId: a.id,
    toId: b.id,
    stroke: "#52525b",
    strokeWidth: 3,
    arrowHead: "arrow",
  })
}

function centerConnector(a: DesignElement, b: DesignElement): ConnectorElement {
  const x1 = a.x + a.width / 2
  const y1 = a.y + a.height / 2
  const x2 = b.x + b.width / 2
  const y2 = b.y + b.height / 2
  return createConnector({
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    points: [x1, y1, x2, y2],
    fromId: a.id,
    toId: b.id,
    stroke: "#52525b",
    strokeWidth: 3,
    arrowHead: "none",
  })
}

const BRAIN_STORM_PROMPTS = [
  "Wild idea",
  "Customer pain",
  "Quick win",
  "Bold bet",
  "What if…?",
  "Risk to watch",
  "Nice to have",
  "Follow-up",
  "Surprise us",
]

/* ------------------------------- Brainstorm ------------------------------- */

function buildBrainstorm({ x, y }: { x: number; y: number }): DesignElement[] {
  const els: StickyElement[] = []
  const cols = 3
  const gap = 40
  const size = 220
  BRAIN_STORM_PROMPTS.forEach((text, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    els.push(
      createSticky({
        x: x + col * (size + gap),
        y: y + row * (size + gap),
        text,
        color: ["#fde68a", "#bbf7d0", "#fbcfe8"][col],
      }),
    )
  })
  return els
}

/* ------------------------------- Flowchart -------------------------------- */

function buildFlowchart({ x, y }: { x: number; y: number }): DesignElement[] {
  const start = createShape({ x: x + 120, y, variant: "ellipse", width: 220, height: 90, fill: "#d9f99d", stroke: "#3f6212", strokeWidth: 2, cornerRadius: 0 })
  const step = createShape({ x: x + 110, y: y + 160, variant: "rect", width: 240, height: 110, fill: "#ffffff", stroke: "#52525b", strokeWidth: 2, cornerRadius: 10 })
  const step2 = createShape({ x: x + 110, y: y + 340, variant: "rect", width: 240, height: 110, fill: "#ffffff", stroke: "#52525b", strokeWidth: 2, cornerRadius: 10 })
  const decision = createShape({ x: x + 100, y: y + 520, variant: "diamond", width: 260, height: 170, fill: "#fde68a", stroke: "#92400e", strokeWidth: 2, cornerRadius: 0 })
  const end = createShape({ x: x + 120, y: y + 760, variant: "ellipse", width: 220, height: 90, fill: "#fbcfe8", stroke: "#831843", strokeWidth: 2, cornerRadius: 0 })

  const label = (parent: ShapeElement, text: string, color: string, size: number): TextElement =>
    createText({
      x: parent.x,
      y: parent.y,
      width: parent.width,
      height: parent.height,
      text,
      fontSize: size,
      align: "center",
      vAlign: "middle",
      color,
      fontWeight: 600,
    })

  const texts: TextElement[] = [
    label(start, "Start", "#3f6212", 24),
    label(step, "Do the work", "#27272a", 22),
    label(step2, "Review result", "#27272a", 22),
    label(decision, "Looks good?", "#92400e", 20),
    label(end, "Ship it", "#831843", 24),
  ]

  const connectors = [
    verticalConnector(start, step),
    verticalConnector(step, step2),
    verticalConnector(step2, decision),
    verticalConnector(decision, end),
  ]
  return [start, step, step2, decision, end, ...connectors, ...texts]
}

/* ------------------------------- Mind map --------------------------------- */

function buildMindMap({ x, y }: { x: number; y: number }): DesignElement[] {
  const center = createShape({ x: x + 250, y: y + 240, variant: "rect", width: 260, height: 110, fill: "#8b5cf6", cornerRadius: 24 })
  const centerText = createText({
    x: center.x,
    y: center.y,
    width: center.width,
    height: center.height,
    text: "Core idea",
    fontSize: 26,
    align: "center",
    vAlign: "middle",
    color: "#ffffff",
    fontWeight: 700,
  })
  const branches = [
    { text: "Who is it for?", x: x, y: y + 60 },
    { text: "Why now?", x: x + 560, y: y + 60 },
    { text: "How does it work?", x: x, y: y + 420 },
    { text: "What could break?", x: x + 560, y: y + 420 },
  ].map((b) => createSticky({ x: b.x, y: b.y, text: b.text, color: "#bbf7d0", width: 240, height: 160, fontSize: 24 }))
  const connectors = branches.map((b) => centerConnector(center, b))
  return [center, centerText, ...branches, ...connectors]
}

/* ----------------------------- Retrospective ------------------------------ */

function buildRetrospective({ x, y }: { x: number; y: number }): DesignElement[] {
  const columns = ["Went well", "To improve", "Action items"]
  const colors = ["#bbf7d0", "#fde68a", "#fbcfe8"]
  const W = 320
  const H = 460
  const GAP = 48
  const els: DesignElement[] = []
  columns.forEach((name, ci) => {
    const fx = x + ci * (W + GAP)
    const frame: FrameElement = {
      id: uid("frame"),
      type: "frame",
      name,
      x: fx,
      y,
      width: W,
      height: H,
      rotation: 0,
      opacity: 1,
      ...FRAME_DEFAULTS,
      label: name,
    }
    els.push(frame)
    for (let i = 0; i < 2; i += 1) {
      els.push(
        createSticky({
          x: fx + 30,
          y: y + 70 + i * 190,
          text: i === 0 ? "Add a note" : "…",
          color: colors[ci],
        }),
      )
    }
  })
  return els
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "brainstorm",
    name: "Brainstorm",
    description: "A 3×3 grid of sticky notes ready for ideas.",
    aspect: 1.1,
    build: buildBrainstorm,
  },
  {
    id: "flowchart",
    name: "Flowchart",
    description: "Start → steps → decision → end, pre-connected.",
    aspect: 0.85,
    build: buildFlowchart,
  },
  {
    id: "mindmap",
    name: "Mind map",
    description: "One center node with four connected branches.",
    aspect: 1.35,
    build: buildMindMap,
  },
  {
    id: "retro",
    name: "Retrospective",
    description: "Three labeled frame columns with starter notes.",
    aspect: 1.5,
    build: buildRetrospective,
  },
]

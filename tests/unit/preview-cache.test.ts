import { describe, expect, it } from "vitest"
import { createLimiter } from "@/lib/studio/preview-cache"
import { parseThumbKey, thumbsToEvict } from "@/lib/studio/local-store"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe("createLimiter", () => {
  it("runs at most `concurrency` tasks at once", async () => {
    const limiter = createLimiter(3)
    let active = 0
    let peak = 0
    const gates = Array.from({ length: 7 }, () => deferred<number>())
    const tasks = gates.map((g) =>
      limiter.run(async () => {
        active += 1
        peak = Math.max(peak, active)
        const v = await g.promise
        active -= 1
        return v
      }),
    )

    // first three start synchronously, the rest queue
    expect(limiter.active()).toBe(3)
    expect(limiter.pending()).toBe(4)
    expect(peak).toBe(3)

    for (const g of gates) g.resolve(1)
    const values = await Promise.all(tasks)
    expect(values).toHaveLength(7)
    expect(values.every((v) => v === 1)).toBe(true)
    expect(peak).toBe(3)
    expect(limiter.active()).toBe(0)
    expect(limiter.pending()).toBe(0)
  })

  it("drains the queue FIFO as slots free up", async () => {
    const limiter = createLimiter(1)
    const order: number[] = []
    const gates = [deferred<void>(), deferred<void>()]
    const tasks = [0, 1].map((i) =>
      limiter.run(async () => {
        order.push(i)
        await gates[i].promise
        order.push(100 + i)
      }),
    )
    gates[0].resolve()
    await tasks[0]
    // task 1 started only after task 0 finished: 100 precedes 1
    expect(order.indexOf(100)).toBeLessThan(order.indexOf(1))
    gates[1].resolve()
    await Promise.all(tasks)
    expect(order).toEqual([0, 100, 1, 101])
  })

  it("releases the slot when a task rejects", async () => {
    const limiter = createLimiter(1)
    const boom = limiter.run(async () => {
      throw new Error("boom")
    })
    await expect(boom).rejects.toThrow("boom")
    const ok = await limiter.run(async () => "ok")
    expect(ok).toBe("ok")
    expect(limiter.active()).toBe(0)
  })

  it("clamps concurrency to at least 1", async () => {
    const limiter = createLimiter(0)
    let active = 0
    let peak = 0
    const t1 = limiter.run(async () => {
      active += 1
      peak = Math.max(peak, active)
      await Promise.resolve()
      active -= 1
    })
    const t2 = limiter.run(async () => {
      active += 1
      peak = Math.max(peak, active)
      await Promise.resolve()
      active -= 1
    })
    await Promise.all([t1, t2])
    expect(peak).toBe(1)
  })
})

describe("parseThumbKey", () => {
  it("parses proj-thumb keys with padded timestamps", () => {
    const ts = 1775000000000
    const key = `proj-thumb:${String(ts).padStart(15, "0")}:cmv1t9u2s006`
    expect(parseThumbKey(key)).toEqual({ ts, id: "cmv1t9u2s006" })
  })

  it("rejects foreign or malformed keys", () => {
    expect(parseThumbKey("studio:local-project:abc")).toBeNull()
    expect(parseThumbKey("proj-thumb:000:abc")).toBeNull()
    expect(parseThumbKey("proj-thumb:000000000000000:")).toBeNull()
    expect(parseThumbKey("")).toBeNull()
    const ts = 1234567890123
    expect(parseThumbKey(`proj-thumb:${String(ts).padStart(15, "0")}:local_x`)).toEqual({ ts, id: "local_x" })
  })
})

describe("thumbsToEvict", () => {
  const entries = [
    { key: "k-old", ts: 100, id: "a" },
    { key: "k-mid", ts: 200, id: "b" },
    { key: "k-new", ts: 300, id: "c" },
  ]

  it("keeps everything when within the cap", () => {
    expect(thumbsToEvict(entries, 3)).toEqual([])
    expect(thumbsToEvict(entries, 10)).toEqual([])
  })

  it("evicts oldest first when over the cap", () => {
    expect(thumbsToEvict(entries, 2)).toEqual(["k-old"])
    expect(thumbsToEvict(entries, 1)).toEqual(["k-old", "k-mid"])
    expect(thumbsToEvict(entries, 0)).toEqual(["k-old", "k-mid", "k-new"])
  })

  it("does not mutate the input", () => {
    const copy = [...entries]
    thumbsToEvict(entries, 1)
    expect(entries).toEqual(copy)
  })
})

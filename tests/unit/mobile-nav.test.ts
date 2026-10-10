import { describe, it, expect } from "vitest"
import { mobileNavModel, isNavActive } from "@/components/studio/dashboard/mobile-nav"

describe("mobileNavModel", () => {
  it("primary slots are exactly home / templates / projects, regardless of role", () => {
    expect(mobileNavModel(false).primary).toEqual(["home", "templates", "projects"])
    expect(mobileNavModel(true).primary).toEqual(["home", "templates", "projects"])
  })

  it("non-admin more sheet holds brand/bulk/trash/settings and excludes admin", () => {
    const { more } = mobileNavModel(false)
    expect(more).toEqual(["brand", "bulk", "trash", "settings"])
    expect(more).not.toContain("admin")
  })

  it("admin is appended to the more sheet only", () => {
    const model = mobileNavModel(true)
    expect(model.more).toEqual(["brand", "bulk", "trash", "settings", "admin"])
    expect(model.primary).not.toContain("admin")
  })

  it("never places the same destination in both primary and more", () => {
    for (const isAdmin of [false, true]) {
      const { primary, more } = mobileNavModel(isAdmin)
      for (const id of primary) expect(more).not.toContain(id)
      expect(new Set([...primary, ...more]).size).toBe(primary.length + more.length)
    }
  })
})

describe("isNavActive", () => {
  it("highlights exact view matches", () => {
    expect(isNavActive("home", "home")).toBe(true)
    expect(isNavActive("projects", "projects")).toBe(true)
    expect(isNavActive("settings", "settings")).toBe(true)
  })

  it("does not cross-highlight unrelated views", () => {
    expect(isNavActive("templates", "projects")).toBe(false)
    expect(isNavActive("home", "templates")).toBe(false)
    expect(isNavActive("brand", "home")).toBe(false)
  })

  it("treats template detail and pack pages as the Templates slot", () => {
    expect(isNavActive("templates-detail", "templates")).toBe(true)
    expect(isNavActive("template-pack", "templates")).toBe(true)
    expect(isNavActive("templates-detail", "home")).toBe(false)
  })
})

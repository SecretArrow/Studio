"use client"

import { useAppStore } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldCheck } from "lucide-react"
import { OverviewTab } from "./admin/overview-tab"
import { UsersTab } from "./admin/users-tab"
import { ProjectsTab } from "./admin/projects-tab"
import { TemplatesTab } from "./admin/templates-tab"
import { JobsTab } from "./admin/jobs-tab"
import { AuditTab } from "./admin/audit-tab"

export function AdminView() {
  const { t } = useI18n()
  const user = useAppStore((s) => s.user)

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-bold">{t("admin.denied.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.denied.body")}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <h1 className="text-xl font-bold">{t("admin.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("admin.subtitle")}</p>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex h-auto w-full max-w-full justify-start gap-1 overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">{t("admin.tab.overview")}</TabsTrigger>
          <TabsTrigger value="users">{t("admin.tab.users")}</TabsTrigger>
          <TabsTrigger value="projects">{t("admin.tab.projects")}</TabsTrigger>
          <TabsTrigger value="templates">{t("admin.tab.templates")}</TabsTrigger>
          <TabsTrigger value="jobs">{t("admin.tab.jobs")}</TabsTrigger>
          <TabsTrigger value="audit">{t("admin.tab.audit")}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        <TabsContent value="projects" className="mt-4"><ProjectsTab /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
        <TabsContent value="jobs" className="mt-4"><JobsTab /></TabsContent>
        <TabsContent value="audit" className="mt-4"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/studio/api-client"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Trash2 } from "lucide-react"
import { type AdminTemplateRow, useApiErrorToast } from "./admin-shared"

export function TemplatesTab() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<AdminTemplateRow | null>(null)

  const templates = useQuery({
    queryKey: ["admin", "templates"],
    queryFn: () => api.get<{ templates: AdminTemplateRow[] }>("/api/templates?limit=200"),
    refetchOnWindowFocus: false,
  })
  useApiErrorToast(templates.error)

  const featureMut = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => api.patch(`/api/admin/templates/${id}`, { featured }),
    onSuccess: () => {
      toast.success(t("admin.templates.featuredUpdated"))
      void qc.invalidateQueries({ queryKey: ["admin", "templates"] })
      void qc.invalidateQueries({ queryKey: ["templates"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/templates/${id}`),
    onSuccess: () => {
      toast.success(t("admin.templates.deleted"))
      setDeleteTarget(null)
      void qc.invalidateQueries({ queryKey: ["admin", "templates"] })
      void qc.invalidateQueries({ queryKey: ["templates"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rows = templates.data?.templates ?? []

  return (
    <div className="space-y-3">
      <div className="max-h-96 overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.templates.name")}</TableHead>
              <TableHead>{t("admin.templates.category")}</TableHead>
              <TableHead>{t("admin.projects.size")}</TableHead>
              <TableHead>{t("admin.templates.featured")}</TableHead>
              <TableHead className="text-right">{t("admin.templates.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {rows.map((tpl) => {
              const busy =
                (featureMut.isPending && featureMut.variables?.id === tpl.id) ||
                (deleteMut.isPending && deleteMut.variables === tpl.id)
              return (
                <TableRow key={tpl.id}>
                  <TableCell className="max-w-52 truncate font-medium">{tpl.name}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{tpl.category}</Badge>
                      <span className="text-xs text-muted-foreground capitalize">{tpl.type}</span>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs tabular-nums">{tpl.width}×{tpl.height}</TableCell>
                  <TableCell>
                    <Switch
                      checked={tpl.featured}
                      disabled={busy}
                      aria-label={`${t("admin.templates.featured")}: ${tpl.name}`}
                      onCheckedChange={(v) => featureMut.mutate({ id: tpl.id, featured: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title={t("admin.templates.delete")}
                        aria-label={`${t("admin.templates.delete")}: ${tpl.name}`}
                        disabled={busy}
                        onClick={() => setDeleteTarget(tpl)}
                      >
                        {deleteMut.isPending && deleteMut.variables === tpl.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {!templates.isLoading && rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("admin.templates.empty")}</p>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.templates.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} — {t("admin.templates.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id) }}
            >
              {deleteMut.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

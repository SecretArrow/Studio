"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/studio/api-client"
import { useAppStore } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Loader2, ShieldCheck, ShieldOff, Trash2 } from "lucide-react"
import { type AdminUserRow, formatDate, useApiErrorToast } from "./admin-shared"

export function UsersTab() {
  const { t } = useI18n()
  const me = useAppStore((s) => s.user)
  const qc = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null)

  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<{ users: AdminUserRow[] }>("/api/admin/users"),
    refetchOnWindowFocus: false,
  })
  useApiErrorToast(users.error)

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "user" | "admin" }) => api.patch(`/api/admin/users/${id}`, { role }),
    onSuccess: () => {
      toast.success(t("admin.users.roleUpdated"))
      void qc.invalidateQueries({ queryKey: ["admin"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      toast.success(t("admin.users.deleted"))
      setDeleteTarget(null)
      void qc.invalidateQueries({ queryKey: ["admin"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rows = users.data?.users ?? []

  return (
    <div className="space-y-3">
      <div className="max-h-96 overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.users.name")}</TableHead>
              <TableHead>{t("admin.users.email")}</TableHead>
              <TableHead>{t("admin.users.role")}</TableHead>
              <TableHead className="text-right">{t("admin.users.projects")}</TableHead>
              <TableHead>{t("admin.users.created")}</TableHead>
              <TableHead className="text-right">{t("admin.users.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {rows.map((u) => {
              const isSelf = u.id === me?.id
              const busy = (roleMut.isPending && roleMut.variables?.id === u.id) || (deleteMut.isPending && deleteMut.variables === u.id)
              return (
                <TableRow key={u.id}>
                  <TableCell className="max-w-40 truncate font-medium">{u.name ?? "—"}</TableCell>
                  <TableCell className="max-w-56 truncate">
                    <span className="flex items-center gap-2">
                      <span className="truncate">{u.email}</span>
                      {isSelf && <Badge variant="secondary">{t("admin.users.you")}</Badge>}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.role === "admin" ? (
                      <Badge className="bg-primary/10 text-primary capitalize">{u.role}</Badge>
                    ) : (
                      <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{u._count.projects}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    {isSelf ? (
                      <span className="block text-right text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className="flex items-center justify-end gap-1">
                        {u.role === "admin" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t("admin.users.demote")}
                            aria-label={`${t("admin.users.demote")}: ${u.email}`}
                            disabled={busy}
                            onClick={() => roleMut.mutate({ id: u.id, role: "user" })}
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t("admin.users.promote")}
                            aria-label={`${t("admin.users.promote")}: ${u.email}`}
                            disabled={busy}
                            onClick={() => roleMut.mutate({ id: u.id, role: "admin" })}
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title={t("admin.users.delete")}
                          aria-label={`${t("admin.users.delete")}: ${u.email}`}
                          disabled={busy}
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {!users.isLoading && rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("admin.users.empty")}</p>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.users.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.email} — {t("admin.users.deleteBody")}
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

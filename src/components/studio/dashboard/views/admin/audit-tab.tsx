"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/studio/api-client"
import { useI18n } from "@/lib/i18n"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type AuditRow, useApiErrorToast } from "./admin-shared"

export function AuditTab() {
  const { t } = useI18n()
  const audit = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => api.get<{ rows: AuditRow[] }>("/api/admin/audit?limit=200"),
    refetchOnWindowFocus: false,
  })
  useApiErrorToast(audit.error)

  const rows = audit.data?.rows ?? []

  return (
    <div className="max-h-96 overflow-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.audit.time")}</TableHead>
            <TableHead>{t("admin.audit.action")}</TableHead>
            <TableHead>{t("admin.audit.actor")}</TableHead>
            <TableHead>{t("admin.audit.target")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audit.isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={`sk-${i}`}>
                {Array.from({ length: 4 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</TableCell>
              <TableCell className="font-medium">{row.action}</TableCell>
              <TableCell className="max-w-44 truncate text-xs">{row.actor?.email ?? "—"}</TableCell>
              <TableCell className="max-w-44 truncate text-xs">{row.target ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!audit.isLoading && rows.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("admin.audit.empty")}</p>
      )}
    </div>
  )
}

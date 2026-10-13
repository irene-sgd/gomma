import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CashFlowChart } from "@/components/dashboard/charts"
import {
  Metric,
  MetricGrid,
  SectionLabel,
} from "@/components/dashboard/primitives"
import { baht, monthLabel, signedBaht } from "@/lib/format"
import type { LiveData, Project } from "@/lib/types"
import { cn } from "cn"

const statusVariant = (status: string) =>
  status === "Completed"
    ? "success"
    : status === "Pending"
      ? "default"
      : "active"

export function FinanceTab({
  project,
  live,
}: {
  project: Project
  live?: LiveData
}) {
  const finance = live?.finance
  const spend = Math.round(finance?.spend ?? 0)
  const revenue = Math.round(finance?.revenue ?? 0)
  const reimb = Math.round(finance?.reimb ?? 0)
  const txns = finance?.txns ?? []
  const net = revenue - spend

  const liveMonths = Object.entries(finance?.monthly ?? {}).sort(([a], [b]) =>
    a < b ? -1 : 1
  )
  const chartData =
    liveMonths.length > 0
      ? liveMonths.map(([month, v]) => ({
          month: monthLabel(month),
          expense: v.expense,
          revenue: v.revenue,
        }))
      : project.monthly.map((m) => ({
          month: m.month,
          expense: m.value,
          revenue: 0,
        }))

  return (
    <div className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <SectionLabel>Financial performance</SectionLabel>
        </CardHeader>
        <CardContent>
          <MetricGrid>
            <Metric
              label="Total expenses"
              value={baht(spend)}
              hint={`${txns.length} transactions`}
              tone={spend > 0 ? "default" : "muted"}
            />
            <Metric
              label="Revenue"
              value={baht(revenue)}
              hint={revenue > 0 ? "total logged" : "pre-revenue"}
              tone={revenue > 0 ? "success" : "muted"}
            />
            <Metric
              label="Net P&L"
              value={net === 0 ? baht(0) : signedBaht(net)}
              hint={net >= 0 ? "surplus" : "deficit"}
              tone={net > 0 ? "success" : net === 0 ? "muted" : "default"}
            />
            <Metric
              label="Awaiting reimb."
              value={baht(reimb)}
              hint={reimb > 0 ? "pending" : "none"}
              tone={reimb > 0 ? "default" : "muted"}
            />
          </MetricGrid>
        </CardContent>
      </Card>

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Transaction ledger</CardTitle>
          </CardHeader>
          <CardContent>
            {txns.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Transaction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txns.slice(0, 8).map((t, i) => {
                      const isRevenue = t.type === "Revenue"
                      return (
                        <TableRow key={`${t.date}-${t.name}-${i}`}>
                          <TableCell className="max-w-56 truncate">
                            {t.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t.category || t.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(t.status)}>
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-bold",
                              isRevenue && "text-success"
                            )}
                          >
                            {isRevenue ? "+" : "−"}
                            {baht(t.amount)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {txns.length > 8 && (
                  <p className="px-3 pt-3 text-xs text-muted-foreground">
                    + {txns.length - 8} more transactions
                  </p>
                )}
              </>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyDescription>
                    {finance
                      ? "No transactions linked to this project."
                      : "Press Refresh to load finance data."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly cash flow</CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={chartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

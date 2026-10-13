"use client"

import { useCallback, useEffect, useState } from "react"

import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinanceView } from "@/components/finance/finance-app"
import { ExecutiveTab } from "@/components/dashboard/executive-tab"
import { FinanceTab } from "@/components/dashboard/finance-tab"
import { LeadsView } from "@/components/dashboard/leads-view"
import { Login } from "@/components/dashboard/login"
import { OperationsTab } from "@/components/dashboard/operations-tab"
import { ProjectHeader } from "@/components/dashboard/project-header"
import { ProjectNav } from "@/components/dashboard/project-nav"
import { StrategyTab } from "@/components/dashboard/strategy-tab"
import {
  clearToken,
  fetchProjectLiveData,
  getToken,
  saveToken,
  verifyToken,
} from "@/lib/notion"
import { projects } from "@/lib/projects-data"
import type { LiveData } from "@/lib/types"

type Phase = "checking" | "login" | "ready"

const IDLE_STATUS = "Press Refresh to load the latest data."

export function DashboardApp() {
  const [phase, setPhase] = useState<Phase>("checking")
  const [staleLogin, setStaleLogin] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState(projects[0].key)
  const [live, setLive] = useState<Record<string, LiveData>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const stored = getToken()
      if (!stored) {
        if (!cancelled) setPhase("login")
        return
      }
      const ok = await verifyToken(stored)
      if (cancelled) return
      if (ok) {
        setToken(stored)
        setPhase("ready")
      } else {
        clearToken()
        setStaleLogin(true)
        setPhase("login")
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogin = useCallback(async (value: string) => {
    if (!value.startsWith("secret_") && !value.startsWith("ntn_")) return false
    if (!(await verifyToken(value))) return false
    saveToken(value)
    setToken(value)
    setStaleLogin(false)
    setPhase("ready")
    return true
  }, [])

  const project = projects.find((p) => p.key === activeKey) ?? projects[0]

  async function refresh() {
    if (!token) return
    setRefreshing(true)
    setError(null)
    try {
      const data = await fetchProjectLiveData(project, token)
      setLive((prev) => ({ ...prev, [project.key]: data }))
    } catch {
      setError("Couldn't refresh. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  if (phase === "checking") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (phase === "login") {
    return <Login initialError={staleLogin} onSubmit={handleLogin} />
  }

  const data = live[project.key]
  const status =
    error ??
    (data
      ? `Last refreshed: ${data.lastRefresh.toLocaleTimeString()}`
      : IDLE_STATUS)

  return (
    <div className="mx-auto flex min-h-svh max-w-[1400px] flex-col gap-2 p-2 lg:flex-row">
      <ProjectNav
        projects={projects}
        activeKey={activeKey}
        onSelect={(key) => {
          setActiveKey(key)
          setError(null)
        }}
      />
      <main className="flex min-w-0 flex-1 flex-col gap-2">
        {activeKey === "leads" && token ? (
          <LeadsView token={token} />
        ) : activeKey === "finance" ? (
          <FinanceView />
        ) : (
          <>
            <ProjectHeader
              project={project}
              live={data}
              status={status}
              refreshing={refreshing}
              onRefresh={refresh}
            />
            <Tabs defaultValue="executive">
              <TabsList className="px-2 py-1">
                <TabsTrigger value="executive">Executive</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
              </TabsList>
              <TabsContent value="executive">
                <ExecutiveTab project={project} live={data} />
              </TabsContent>
              <TabsContent value="finance">
                <FinanceTab project={project} live={data} />
              </TabsContent>
              <TabsContent value="operations">
                <OperationsTab live={data} />
              </TabsContent>
              <TabsContent value="strategy">
                <StrategyTab project={project} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function Login({
  initialError,
  onSubmit,
}: {
  initialError?: boolean
  onSubmit: (value: string) => Promise<boolean>
}) {
  const [value, setValue] = useState("")
  const [failed, setFailed] = useState(Boolean(initialError))
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const ok = await onSubmit(value.trim())
    if (!ok) {
      setFailed(true)
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-svh p-2">
      <Card className="m-auto w-full max-w-[400px] [--card-spacing:--spacing(8)]">
        <CardHeader>
          <CardTitle className="text-center text-2xl leading-tight">
            Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col items-center gap-4">
            <FieldGroup className="w-full">
              <Field data-invalid={failed || undefined}>
                <FieldLabel htmlFor="login-key" className="sr-only">
                  Login
                </FieldLabel>
                <Input
                  id="login-key"
                  type="password"
                  autoComplete="off"
                  autoFocus
                  value={value}
                  aria-invalid={failed || undefined}
                  onChange={(e) => {
                    setValue(e.target.value)
                    setFailed(false)
                  }}
                />
                {failed && (
                  <FieldError className="rounded-md bg-secondary px-4 py-3 text-center text-sm text-foreground">
                    Login failed. Please try again.
                  </FieldError>
                )}
              </Field>
            </FieldGroup>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

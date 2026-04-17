"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "../_lib/api";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(password);
      router.replace("/database");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center gap-1">
          <div className="text-xs font-mono uppercase tracking-wider text-black/50">
            Hellenic Geographical Society
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Database</h1>
          <p className="text-xs text-black/50">Authorized personnel only.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        <Button type="submit" disabled={busy || !password} className="mt-6 w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-black/40">
          This is an internal tool. All access is logged.
        </p>
      </form>
    </div>
  );
}

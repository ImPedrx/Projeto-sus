"use client";

import { useState } from "react";
import Script from "next/script";

type Result = { error: string } | undefined | void;

export function LoginForm({
  action,
  turnstileSiteKey,
}: {
  action: (formData: FormData) => Promise<Result>;
  turnstileSiteKey?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    // Turnstile injects a hidden `cf-turnstile-response` input into the form,
    // so building FormData from the form carries the token to the action.
    const result = await action(new FormData(event.currentTarget));
    setPending(false);
    if (result && "error" in result) setError(result.error);
  }

  return (
    <>
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      )}
      <form
        method="post"
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4"
      >
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-muted">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded border border-border bg-surface px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-muted">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded border border-border bg-surface px-3 py-2"
          />
        </div>
        {turnstileSiteKey && (
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
        )}
        {error && (
          <p role="alert" className="text-sm text-foreground">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-foreground px-3 py-2 font-medium text-background disabled:opacity-50"
        >
          Entrar
        </button>
      </form>
    </>
  );
}

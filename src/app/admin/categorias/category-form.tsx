"use client";

import { useRef, useState } from "react";

export function CategoryForm({
  action,
}: {
  action: (formData: FormData) => Promise<{ error: string } | { ok: true }>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const result = await action(new FormData(event.currentTarget));
    if ("error" in result) setError(result.error);
    else formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm text-muted">
          Nova categoria
        </label>
        <input
          id="name"
          name="name"
          required
          className="rounded border border-border bg-surface px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-foreground px-3 py-2 font-medium text-background"
      >
        Adicionar
      </button>
      {error && (
        <p role="alert" className="w-full text-sm">
          {error}
        </p>
      )}
    </form>
  );
}

# Plano de correção de segurança — SusProd

Data: 2026-08-22
Origem: revisão de terceiro (pentest de reconhecimento) + auditoria do código-fonte real.

> **Nota (pós-lançamento):** o conceito de categoria/gênero foi removido do produto a pedido do cliente. Referências a `categories`, `beat_categories` e `/admin/categorias` abaixo são históricas.

## Contexto e veredito

A revisão externa trabalhou só de fora (caixa-preta) e classificou vários achados
como CRÍTICO/ALTO. A auditoria do código confirma que **o boundary de segurança
real é o Row Level Security (RLS) do Postgres, e ele está correto e ativo**:

- Todo write em `beats`, `categories`, `beat_categories`, `orders`, `order_items`
  e no bucket exige `private.is_admin()`.
- `anon` só lê beats com `status = 'published'` (que já são públicos na loja) e
  **nunca** lê `orders`/`order_items`.
- Pedidos só são criados via `place_order()` (SECURITY DEFINER), nunca lidos por anon.
- Nenhuma `service_role` key aparece no código — só a anon key (pública por natureza).
- Masters ficam em `beat-private` e só saem como signed URL após aprovação.

Consequência: **não há vazamento de dado sensível nem IDOR real.** O que a revisão
externa chamou de "vazamento crítico do /admin" é o catálogo já público mais o HTML
do shell admin. Ainda assim, valem correções de **defesa em profundidade** para que
a segurança não dependa de uma única camada, além de descartar formalmente os
achados falsos.

## Triagem dos achados do report

| Achado do report | Classificação real | Ação |
|---|---|---|
| 1. `/admin` vaza dados via payload RSC (CRÍTICO) | Baixo-Médio | Corrigir (F1) |
| 2. Login via GET / credencial na URL (ALTO) | Falso; edge case JS-off | Corrigir barato (F3) |
| 3. Server Action IDs expostas (ALTO) | Médio (defesa em prof.) | Corrigir (F2) |
| 4. Bucket público do Supabase (MÉDIO) | Baixo / intencional | Verificar (F5), sem código |
| 5. IDs sequenciais / IDOR (MÉDIO) | Baixo (RLS bloqueia) | Sem ação; documentado |
| 6. robots/sitemap 404 (BAIXO) | Informativo | Corrigir (F4) |

## Causa raiz do achado 1

No App Router, layout e page renderizam **em paralelo**. O guard de auth vive em
`src/app/admin/layout.tsx`, mas `src/app/admin/page.tsx` (e as demais páginas de
`/admin`) executam suas queries mesmo quando o layout dispara `redirect()`. Como
essas queries rodam com o cliente anon (sem sessão), o RLS as reduz a dados
públicos — por isso o impacto é baixo — mas o padrão é frágil: a proteção do
conteúdo depende do RLS, não do guard. A correção move o guard para dentro de
cada page, antes de qualquer query.

---

## Correções

### F1 — Guard de auth em cada página admin (Médio)

Criar um helper e chamá-lo no topo de toda página sob `/admin` (exceto `login`),
antes de qualquer query. O guard do layout permanece como rede de segurança.

Novo arquivo `src/lib/auth/require-admin.ts`:

```ts
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

// Guard para Server Components: derruba o não-admin antes de qualquer query,
// para que nenhuma página admin busque dados nem monte seu payload RSC para
// quem não está autenticado.
export async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) redirect("/admin/login");

  return supabase;
}
```

Aplicar em cada page, trocando `const supabase = await createServerClient()` por
`const supabase = await requireAdmin()` no início:

- `src/app/admin/page.tsx`
- `src/app/admin/beats/novo/page.tsx`
- `src/app/admin/beats/[id]/page.tsx`
- `src/app/admin/categorias/page.tsx`
- `src/app/admin/pedidos/page.tsx`
- `src/app/admin/pedidos/[id]/page.tsx`

### F2 — Assert de admin em toda Server Action admin (Médio)

Hoje as actions confiam apenas no RLS. Um non-admin autenticado que invoque a
action recebe um `{ ok: true }` falso (0 linhas afetadas, sem erro). Adicionar
uma checagem explícita que **lança** (a action não redireciona).

Adicionar a `src/lib/auth/require-admin.ts`:

```ts
// Guard para Server Actions: lança em vez de redirecionar, para que a action
// falhe alto para quem não é admin em vez de reportar sucesso silencioso.
export async function assertAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) throw new Error("Unauthorized");

  return supabase;
}
```

Chamar no topo de cada action, reutilizando o client retornado:

- `src/app/admin/beats/actions.ts`: `createBeat`, `updateBeat`, `setBeatStatus`, `deleteBeat`
- `src/app/admin/categorias/actions.ts`: `createCategory`, `deleteCategory`
- `src/app/admin/pedidos/actions.ts`: `moveTo` (cobre `approveOrder`/`markOrderPaid`/`cancelOrder`) e `signDelivery`

Padrão: `const supabase = await assertAdmin();` no lugar de
`const supabase = await createServerClient();`.

`src/app/auth/actions.ts` (`signIn`/`signOut`) e
`src/app/(site)/checkout/actions.ts` (`placeOrder`) ficam como estão — são
públicas por design.

### F3 — `method="post"` no form de login (Baixo)

Fecha o edge case de JS desligado, onde um form sem `method` submeteria via GET
e jogaria e-mail/senha na query string.

Em `src/app/admin/login/login-form.tsx`, no `<form onSubmit={onSubmit}`, adicionar
`method="post"`.

### F4 — `robots.ts` bloqueando `/admin` (Baixo/Info)

Novo `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.prodigosus.store";
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${base}/sitemap.xml`,
  };
}
```

(Opcional) `src/app/sitemap.ts` listando home + páginas de projeto/catálogo
públicas. Não é segurança; encerra o achado 6.

### F5 — Verificações operacionais (sem código)

1. **Bucket:** confirmar no painel Supabase que `beat-private` está com
   `public = false` e que nenhum objeto de `masters/` foi parar em `beat-public`.
   O código já roteia certo (`bucketFor`), isto é só conferência de estado.
2. **Rate limit no login:** o Supabase Auth já limita tentativas de
   `signInWithPassword` por padrão. Confirmar no painel (Auth → Rate Limits).
   (Opcional, se quiser reforço) adicionar Turnstile/captcha no `/admin/login`.
3. **Storage RLS:** confirmar que não existe policy de SELECT pública em
   `storage.objects` para `beat-private` (só há a policy admin — correto).

## Descartados (achados sem ação)

- **Login via GET:** o form usa Server Action via `onSubmit`; credenciais nunca
  vão para a URL em operação normal. F3 fecha só o resíduo JS-off.
- **IDOR por IDs sequenciais:** não há rota que sirva draft ou pedido por ID a um
  não-admin; o RLS bloqueia. Trocar por UUID não agrega segurança aqui.
- **Server Action IDs no HTML:** inerente ao Next.js; o risco (invocação por
  não-admin) é fechado por F2, não por ocultar os IDs.

## Ordem de execução

1. F2 (assert nas actions) — maior valor de defesa em profundidade.
2. F1 (guard nas pages) — corrige o achado "crítico" do report.
3. F3, F4 — correções baratas.
4. F5 — conferência no painel Supabase.

## Verificação pós-correção

- `npm run build` e `npm run lint` limpos.
- `curl -s https://www.prodigosus.store/admin | grep -o 'admin/beats/[0-9]*'` não
  deve mais retornar linhas de beat (o guard corta antes da query).
- Logado como usuário **não** presente em `admin_users`: `/admin` redireciona pro
  login e as actions lançam `Unauthorized`.
- Logado como admin: todo o fluxo (criar/editar/status/excluir beat, categorias,
  pedidos, signDelivery) continua funcionando.
- Fluxo público (catálogo, checkout, `place_order`) intacto.

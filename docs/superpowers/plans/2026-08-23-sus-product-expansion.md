# Plano — Expansão de produto Sus

Data: 2026-08-23

Fase nova pedida pelo dono depois do endurecimento de segurança. Oito frentes,
com quatro decisões travadas:

- **Idioma:** inglês na raiz (`/`), português movido para `/pt`.
- **Contrato:** assinatura leve no próprio app (link por pedido, aceite + nome,
  grava data/hora/IP). Sem provedor externo.
- **Nome:** trocar `SusProd`/`SUSPROD` por `Sus`.
- **Dashboard:** receita + métricas (total pago por período, contadores por
  status, ticket médio, mais vendidos).

## Estado das frentes

| # | Frente | Precisa de | Estado |
|---|--------|-----------|--------|
| 7 | Renomear para Sus | — | ✅ feito |
| 8 | Inglês por padrão | — | ✅ feito |
| 1 | Dashboard de receita | — (dados de `orders`) | a fazer |
| 6 | Link de assinatura de contrato | template já existe em `contracts/` | a fazer |
| 4 | Redes sociais | **handles do dono** | aguardando conteúdo |
| 5 | FAQ da compra | **perguntas/respostas** | aguardando conteúdo |
| 2 | Sobre (história, referências) | **texto do dono** | aguardando conteúdo |
| 3 | Artistas que fizeram trampo | **nomes/links** | aguardando conteúdo |

## Chunk 1 — Identidade (feito)

- Rename global `SusProd`→`Sus`, `SUSPROD`→`SUS`.
- i18n invertido: `PATHS` e `localeFromPathname` agora tratam EN como raiz e PT
  sob `/pt`. Metadados `<html lang>` seguem o locale; `/admin` fica pinado em
  `pt-BR`.
- Rotas movidas: `(site)/en/*` → raiz; `(site)/{page,projetos,checkout}` →
  `(site)/pt/*`. `checkout-form.tsx` e `actions.ts` (compartilhados) vivem na
  raiz `checkout/` e são importados pelos dois locales via alias.
- `sitemap.ts` atualizado para as rotas novas. Testes de i18n reescritos.

## Chunk 2 — Dashboard de receita (admin)

Nova rota `admin/` home ou `admin/painel`: total pago no período, contagem por
status, ticket médio, beats mais vendidos. Fonte: `orders` + `order_items`
(pagamento é manual, então receita = pedidos `status = 'paid'`). Só leitura,
protegido por `requireAdmin()`.

## Chunk 3 — Assinatura de contrato

- Migração: tabela `contract_signatures` (order_id, signer_name, signed_at,
  client_ip, contract_version) + RLS admin-only, mais uma RPC pública
  `sign_contract(order_code, name)` no molde de `place_order` (SECURITY DEFINER,
  valida o código, grava o aceite).
- Rota pública `/contract/[code]` que renderiza o template de
  `contracts/non-exclusive-license.template.html` com os dados do pedido e um
  formulário de aceite.
- No painel, botão que gera/compartilha o link do contrato por pedido.

## Chunks de conteúdo (4, 5, 2, 3)

Frontend pronto para receber conteúdo do dono. Cada seção entra na navegação e
no dicionário i18n (PT/EN). Precisam do material real antes de publicar:

- **Sobre:** história, referências, o que define o som.
- **Artistas:** nomes, papel, link (Instagram/streaming).
- **Redes:** handles (Instagram, YouTube, TikTok, etc.).
- **FAQ:** perguntas e respostas sobre como funciona a compra/entrega.

## Verificação por chunk

`npm run lint`, `npm run build`, `npm test` limpos; rotas conferidas no output
do build; fluxo público e admin manualmente sãos antes de cada push.

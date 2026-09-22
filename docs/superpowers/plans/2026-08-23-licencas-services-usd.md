# Sus — licenças, services, USD e ajustes de layout

> **Nota (pós-lançamento):** o conceito de categoria foi removido do produto a pedido do cliente. A menção a categorias abaixo é histórica.

## Decisões

- Preços de licença: padrão global no código (MP3 $60, WAV $120) com override por beat no admin.
- EXCLUSIVE: sem preço fixo — "sob consulta" quando o beat não tiver valor próprio.
- Services: novo tipo na tabela `beats` (`kind = 'beat' | 'service'`), reaproveitando cadastro, capa e carrinho.
- USD: apenas troca do formatador. `price_cents` passa a ser centavos de dólar; os valores já cadastrados mantêm o número e são reajustados no admin.

## Etapas

### 1. Migração `0008_licenses_and_services.sql`
- `beats`: `kind text not null default 'beat'`, `price_wav_cents int`, `price_exclusive_cents int`.
- `price_cents`, `preview_path` e `master_mp3_path` passam a aceitar nulo; um check exige preview e MP3 quando `kind = 'beat'`.
- `order_items`: coluna `license` (`mp3 | wav | exclusive | service`), `price_cents` nulo permitido (exclusivo sob consulta), chave primária passa a `(order_id, beat_id, license)`.
- `orders.total_cents >= 0`.
- `place_order` passa a receber `items: [{ beatId, license }]` e resolve o preço no servidor por licença.

### 2. Domínio (`src/lib/beats/licenses.ts`)
- Tipo `License`, padrões globais e `licensePriceCents(beat, license)`.
- Os mesmos padrões vivem na função SQL; um comentário em cada lado aponta para o outro.

### 3. Moeda e data
- `formatPrice` passa a `en-US` / `USD`.
- `StoreBeat` ganha `createdAt`; card e diálogo exibem a data de postagem.

### 4. Carrinho e checkout
- Item do carrinho passa a ser `(beatId, license)`; o mesmo beat cabe em duas licenças.
- Preço nulo aparece como "sob consulta" e não entra no total.
- `placeOrder` envia `items` em vez de `beatIds`; o e-mail do produtor lista a licença de cada item.

### 5. Admin
- Formulário de beat: seletor de tipo (beat/service), campos de preço MP3/WAV/EXCLUSIVE com o padrão global como placeholder, arquivos de áudio só para beats.
- Lista e página de pedido mostram a licença.

### 6. Layout
- Header: `Tracks` e `Services` lado a lado, no lugar de `Projects`.
- Home: remove o botão "Hear the beats"; "see all" vira botão destacado.
- `/tracks`: layout em linhas (não grade). `/projects` redireciona para `/tracks`.
- `/services`: mesma lista, filtrada por `kind = 'service'`.
- Diálogo do beat: três botões de licença (MP3 / WAV / EXCLUSIVE).

### 7. E-mail do admin
- Código já existe (`src/lib/email/send.ts`). Falta configurar `RESEND_API_KEY`, `ORDER_NOTIFICATION_FROM` e `ORDER_NOTIFICATION_TO`.

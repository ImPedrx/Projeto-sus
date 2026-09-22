import { z } from "zod";

// A price field that may be left empty. Null means "use the site default" for
// the MP3 and WAV licences, and "quote it by hand" for the exclusive one.
function optionalPrice(label: string) {
  return z
    .number({ error: `Informe o preço ${label} em números, por exemplo 60.00.` })
    .int(`O preço ${label} deve ser um valor inteiro em centavos.`)
    .positive(`Informe um preço ${label} maior que zero.`)
    .nullable();
}

export const beatInputSchema = z.object({
  kind: z.enum(["beat", "service"]).default("beat"),
  title: z
    .string()
    .trim()
    .min(1, "Informe um título.")
    .max(80, "Título muito longo."),
  // The form feeds these through Number(), so anything unparseable arrives as
  // NaN. Zod would report it as "expected number, received NaN", which names
  // neither the field nor the fix.
  priceCents: optionalPrice("MP3"),
  priceWavCents: optionalPrice("WAV"),
  priceExclusiveCents: optionalPrice("EXCLUSIVE"),
  bpm: z
    .number({ error: "Informe o BPM em números, entre 40 e 300." })
    .int("O BPM deve ser um número inteiro.")
    .min(40, "O BPM mínimo é 40.")
    .max(300, "O BPM máximo é 300.")
    .nullable(),
  musicalKey: z
    .string()
    .trim()
    .max(10, "Use no máximo 10 caracteres no tom.")
    .nullable(),
  description: z
    .string()
    .trim()
    .max(600, "A descrição deve ter no máximo 600 caracteres.")
    // The column is nullable and the field was added after the first beats
    // existed, so an input that omits it entirely is as valid as one that sends
    // null. Both land as null.
    .nullable()
    .default(null),
})
  // A service is priced by the MP3 column alone and never falls back to a beat
  // default, so it is the one case where a price is required. The database
  // enforces the same rule in beats_service_needs_price.
  .refine((input) => input.kind !== "service" || input.priceCents !== null, {
    path: ["priceCents"],
    message: "Informe o preço do serviço.",
  });

export type BeatInput = z.infer<typeof beatInputSchema>;

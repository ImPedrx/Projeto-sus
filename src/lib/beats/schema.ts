import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe um nome.")
    .max(40, "Nome muito longo."),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const beatInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe um título.")
    .max(80, "Título muito longo."),
  // The form feeds these through Number(), so anything unparseable arrives as
  // NaN. Zod would report it as "expected number, received NaN", which names
  // neither the field nor the fix.
  priceCents: z
    .number({ error: "Informe o preço em números, por exemplo 199,00." })
    .int("O preço deve ser um valor inteiro em centavos.")
    .positive("Informe um preço maior que zero."),
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
  categoryIds: z
    .array(z.number().int().positive())
    .min(1, "Escolha ao menos uma categoria."),
});

export type BeatInput = z.infer<typeof beatInputSchema>;

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
  priceCents: z
    .number()
    .int("O preço deve ser um valor inteiro em centavos.")
    .positive("Informe um preço maior que zero."),
  bpm: z.number().int().min(40).max(300).nullable(),
  musicalKey: z.string().trim().max(10).nullable(),
  categoryIds: z
    .array(z.number().int().positive())
    .min(1, "Escolha ao menos uma categoria."),
});

export type BeatInput = z.infer<typeof beatInputSchema>;

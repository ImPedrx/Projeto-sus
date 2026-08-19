import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe um nome.")
    .max(40, "Nome muito longo."),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

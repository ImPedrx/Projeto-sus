import { z } from "zod";

// Only the two fields the producer needs in order to reply are required. The
// artist name and Instagram are context he likes to have when he answers, not
// a gate in front of the order.
export const orderInputSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(80, "Nome muito longo."),
  customerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido — é por ele que o produtor responde."),
  artistName: z
    .string()
    .trim()
    .max(80, "Nome artístico muito longo.")
    .optional()
    .transform((value) => value || undefined),
  instagram: z
    .string()
    .trim()
    // People type the handle with or without the @, and paste the full profile
    // URL about as often as either.
    .transform((value) => value.replace(/^@+/, "").replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "").replace(/\/+$/, ""))
    .pipe(z.string().max(40, "Usuário do Instagram muito longo."))
    .optional()
    .transform((value) => value || undefined),
  note: z
    .string()
    .trim()
    .max(1000, "O recado deve ter no máximo 1000 caracteres.")
    .optional()
    .transform((value) => value || undefined),
  beatIds: z
    .array(z.number().int().positive())
    .min(1, "Seu carrinho está vazio.")
    .max(20, "São no máximo 20 beats por pedido."),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

import { describe, it, expect } from "vitest";
import { buildOrderMessage, buildOrderSubject } from "@/lib/orders/message";

const order = {
  code: "SUS-A1B2C3",
  customerName: "João Paulo",
  customerEmail: "joao@example.com",
  items: [
    { title: "Escape Route", license: "mp3" as const, priceCents: 6000 },
    { title: "Walkin", license: "wav" as const, priceCents: 12000 },
  ],
  totalCents: 18000,
};

describe("buildOrderMessage", () => {
  it("carries the code, the contact and every item with its price", () => {
    const message = buildOrderMessage(order);
    expect(message).toContain("SUS-A1B2C3");
    expect(message).toContain("joao@example.com");
    expect(message).toContain("Escape Route");
    expect(message).toContain("Walkin");
    expect(message).toContain("$60.00");
    expect(message).toContain("$120.00");
  });

  it("names the licence bought for each item", () => {
    const message = buildOrderMessage(order);
    expect(message).toContain("Escape Route [MP3]");
    expect(message).toContain("Walkin [WAV]");
  });

  it("marks an exclusive licence with no price as a quote", () => {
    const message = buildOrderMessage({
      ...order,
      items: [{ title: "Escape Route", license: "exclusive" as const, priceCents: null }],
      totalCents: 0,
    });
    expect(message).toContain("Escape Route [EXCLUSIVE] — sob consulta");
    expect(message).toContain("itens sob consulta não entram no total");
  });

  it("states the total the database computed", () => {
    expect(buildOrderMessage(order)).toContain("Total: $180.00");
  });

  it("leaves out the optional fields that were not filled", () => {
    const message = buildOrderMessage(order);
    expect(message).not.toContain("Nome artístico");
    expect(message).not.toContain("Instagram");
    expect(message).not.toContain("Recado");
  });

  it("includes the optional fields that were", () => {
    const message = buildOrderMessage({
      ...order,
      artistName: "São J",
      instagram: "susprod",
      note: "Quero exclusiva desse.",
      panelUrl: "https://example.com/admin/pedidos",
    });
    expect(message).toContain("Nome artístico: São J");
    expect(message).toContain("Instagram: @susprod");
    expect(message).toContain("Quero exclusiva desse.");
    expect(message).toContain("https://example.com/admin/pedidos");
  });
});

describe("buildOrderSubject", () => {
  it("names the order and who placed it", () => {
    expect(buildOrderSubject(order)).toBe("Pedido SUS-A1B2C3 — João Paulo");
  });
});

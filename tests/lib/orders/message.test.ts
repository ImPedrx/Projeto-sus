import { describe, it, expect } from "vitest";
import { buildOrderMessage, buildOrderSubject } from "@/lib/orders/message";

const order = {
  code: "SUS-A1B2C3",
  customerName: "João Paulo",
  customerEmail: "joao@example.com",
  items: [
    { title: "Escape Route", priceCents: 19900 },
    { title: "Walkin", priceCents: 29900 },
  ],
  totalCents: 49800,
};

describe("buildOrderMessage", () => {
  it("carries the code, the contact and every item with its price", () => {
    const message = buildOrderMessage(order);
    expect(message).toContain("SUS-A1B2C3");
    expect(message).toContain("joao@example.com");
    expect(message).toContain("Escape Route");
    expect(message).toContain("Walkin");
    expect(message).toContain("R$ 199,00");
    expect(message).toContain("R$ 299,00");
  });

  it("states the total the database computed", () => {
    expect(buildOrderMessage(order)).toContain("Total: R$ 498,00");
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

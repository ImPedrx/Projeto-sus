import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BeatRowActions } from "@/app/admin/beats/beat-row-actions";
import type { BeatStatus } from "@/lib/beats/queries";

const ok = () => vi.fn().mockResolvedValue({ ok: true });

function renderRow(
  props: Partial<{
    status: BeatStatus;
    orderCount: number;
    setStatus: ReturnType<typeof ok>;
    archive: ReturnType<typeof ok>;
    remove: ReturnType<typeof ok>;
  }> = {},
) {
  const handlers = {
    setStatus: props.setStatus ?? ok(),
    archive: props.archive ?? ok(),
    remove: props.remove ?? ok(),
  };

  render(
    <BeatRowActions
      id={3}
      status={props.status ?? "draft"}
      orderCount={props.orderCount ?? 0}
      {...handlers}
    />,
  );

  return handlers;
}

describe("BeatRowActions", () => {
  it("publishes a draft", async () => {
    const { setStatus } = renderRow({ status: "draft" });

    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(setStatus).toHaveBeenCalledWith(3, "published");
  });

  it("unpublishes a published beat", async () => {
    const { setStatus } = renderRow({ status: "published" });

    await userEvent.click(screen.getByRole("button", { name: "Despublicar" }));

    expect(setStatus).toHaveBeenCalledWith(3, "draft");
  });

  it("hides the status toggle for a sold beat", () => {
    renderRow({ status: "sold" });

    expect(screen.queryByRole("button", { name: "Publicar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Despublicar" })).toBeNull();
  });

  it("shows the error returned by delete", async () => {
    const remove = vi
      .fn()
      .mockResolvedValue({ error: "Não foi possível excluir o beat." });
    renderRow({ remove });

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível excluir o beat.",
    );
  });

  it("says something even when the action throws", async () => {
    const remove = vi.fn().mockRejectedValue(new Error("Unauthorized"));
    renderRow({ remove });

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível concluir.",
    );
  });

  // An ordered beat cannot be deleted -- the foreign key is ON DELETE RESTRICT
  // -- so the row must not offer a delete that can only fail.
  it("offers archiving instead of deleting once the beat has been ordered", async () => {
    const { archive, remove } = renderRow({ orderCount: 2 });

    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Arquivar" }));

    expect(archive).toHaveBeenCalledWith(3);
    expect(remove).not.toHaveBeenCalled();
  });

  it("still deletes a beat nobody ordered", async () => {
    const { archive, remove } = renderRow({ orderCount: 0 });

    expect(screen.queryByRole("button", { name: "Arquivar" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(remove).toHaveBeenCalledWith(3);
    expect(archive).not.toHaveBeenCalled();
  });

  it("offers only a restore for an archived beat", async () => {
    const { setStatus } = renderRow({ status: "archived", orderCount: 2 });

    expect(screen.queryByRole("button", { name: "Publicar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Arquivar" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Restaurar" }));

    expect(setStatus).toHaveBeenCalledWith(3, "draft");
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BeatRowActions } from "@/app/admin/beats/beat-row-actions";

const ok = () => vi.fn().mockResolvedValue({ ok: true });

describe("BeatRowActions", () => {
  it("publishes a draft", async () => {
    const setStatus = ok();
    render(
      <BeatRowActions
        id={3}
        status="draft"
        setStatus={setStatus}
        remove={ok()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(setStatus).toHaveBeenCalledWith(3, "published");
  });

  it("unpublishes a published beat", async () => {
    const setStatus = ok();
    render(
      <BeatRowActions
        id={3}
        status="published"
        setStatus={setStatus}
        remove={ok()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Despublicar" }));

    expect(setStatus).toHaveBeenCalledWith(3, "draft");
  });

  it("hides the status toggle for a sold beat", () => {
    render(
      <BeatRowActions id={3} status="sold" setStatus={ok()} remove={ok()} />,
    );

    expect(screen.queryByRole("button", { name: "Publicar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Despublicar" })).toBeNull();
  });

  it("shows the error returned by delete", async () => {
    const remove = vi
      .fn()
      .mockResolvedValue({ error: "Não foi possível excluir o beat." });
    render(
      <BeatRowActions id={3} status="draft" setStatus={ok()} remove={remove} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível excluir o beat.",
    );
  });
});

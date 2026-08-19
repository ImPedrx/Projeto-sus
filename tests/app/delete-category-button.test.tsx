import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteCategoryButton } from "@/app/admin/categorias/delete-category-button";

describe("DeleteCategoryButton", () => {
  it("calls the action with the category id", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<DeleteCategoryButton id={7} action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(action).toHaveBeenCalledWith(7);
  });

  it("shows the error returned by the action", async () => {
    const action = vi.fn().mockResolvedValue({
      error: "Existem beats nessa categoria. Remova-os antes.",
    });
    render(<DeleteCategoryButton id={7} action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Existem beats nessa categoria. Remova-os antes.",
    );
  });
});

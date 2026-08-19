import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/app/admin/login/login-form";

describe("LoginForm", () => {
  it("submits the typed credentials", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("E-mail"), "sus@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "hunter2");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("email")).toBe("sus@example.com");
    expect(formData.get("password")).toBe("hunter2");
  });

  it("shows the error returned by the action", async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ error: "E-mail ou senha inválidos." });
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("E-mail"), "sus@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "errada");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha inválidos.",
    );
  });
});

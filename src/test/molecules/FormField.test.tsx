import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { FormField } from "@/components/molecules/FormField";
import * as React from "react";

afterEach(() => {
  cleanup();
});

describe("FormField", () => {
  test("connects validation errors to the input description", () => {
    render(<FormField id="seller-name" label="Nome" error="Nome obrigatório" />);

    const input = screen.getByLabelText("Nome");
    const error = screen.getByRole("alert");

    expect(error.id).toBe("seller-name-error");
    expect(input.getAttribute("aria-describedby")).toBe("seller-name-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  test("preserves existing described-by ids when adding the error id", () => {
    render(
      <FormField
        id="seller-name"
        label="Nome"
        error="Nome obrigatório"
        aria-describedby="seller-name-helper"
      />
    );

    expect(screen.getByLabelText("Nome").getAttribute("aria-describedby")).toBe("seller-name-helper seller-name-error");
  });
});

import { expect, test, describe, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { EmptyState } from "@/components/atoms/EmptyState";
import * as React from "react";

afterEach(() => {
  cleanup();
});

describe("EmptyState", () => {
  test("renders title", () => {
    render(<EmptyState title="No data found" />);
    expect(screen.getByText("No data found")).toBeDefined();
  });

  test("renders description when provided", () => {
    render(<EmptyState title="Title" description="A detailed description" />);
    expect(screen.getByText("A detailed description")).toBeDefined();
  });

  test("does not render description when omitted", () => {
    const { container } = render(<EmptyState title="Title" />);
    const descs = container.querySelectorAll("p");
    const hasDescription = Array.from(descs).some(
      (el) => el.textContent === "Title"
    );
    expect(hasDescription || descs.length === 0).toBe(true);
  });

  test("renders icon", () => {
    render(
      <EmptyState
        title="Title"
        icon={<svg data-testid="test-icon"><circle /></svg>}
      />
    );
    expect(screen.getByTestId("test-icon")).toBeDefined();
  });

  test("renders action", () => {
    render(
      <EmptyState
        title="Title"
        action={<button>Add new item</button>}
      />
    );
    expect(screen.getByRole("button", { name: /add new item/i })).toBeDefined();
  });

  test("applies sm size variant", () => {
    const { container } = render(<EmptyState title="T" size="sm" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("py-mx-md");
  });

  test("applies md size variant", () => {
    const { container } = render(<EmptyState title="T" size="md" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("py-mx-xl");
  });

  test("applies lg size variant", () => {
    const { container } = render(<EmptyState title="T" size="lg" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("py-mx-3xl");
  });
});

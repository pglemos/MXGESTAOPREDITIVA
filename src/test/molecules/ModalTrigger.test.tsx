import { expect, test, describe, afterEach } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { ModalTrigger } from "@/components/molecules/ModalTrigger";

afterEach(() => {
  cleanup();
});

describe("ModalTrigger", () => {
  test("renders trigger children (button)", () => {
    render(
      <ModalTrigger title="My Modal" modalContent={<p>Content</p>}>
        <button>Open</button>
      </ModalTrigger>
    );
    expect(screen.getByRole("button", { name: /open/i })).toBeDefined();
  });

  test("modal is not visible initially", () => {
    render(
      <ModalTrigger title="Hidden Modal" modalContent={<p>Content</p>}>
        <button>Open</button>
      </ModalTrigger>
    );
    expect(screen.queryByText("Hidden Modal")).toBeNull();
  });

  test("clicking trigger opens the modal", () => {
    render(
      <ModalTrigger title="Visible Modal" modalContent={<p>Content</p>}>
        <button>Open</button>
      </ModalTrigger>
    );
    fireEvent.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByText("Visible Modal")).toBeDefined();
  });

  test("modal shows the content", () => {
    render(
      <ModalTrigger title="T" modalContent={<p>Modal body text</p>}>
        <button>Open</button>
      </ModalTrigger>
    );
    fireEvent.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByText("Modal body text")).toBeDefined();
  });

  test("modal shows description when provided", () => {
    render(
      <ModalTrigger title="T" description="A modal description" modalContent={<p>Content</p>}>
        <button>Open</button>
      </ModalTrigger>
    );
    fireEvent.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByText("A modal description")).toBeDefined();
  });

  test("applies custom className", () => {
    const { container } = render(
      <ModalTrigger title="T" modalContent={<p>C</p>} className="my-trigger-class">
        <button>Open</button>
      </ModalTrigger>
    );
    const triggerDiv = container.querySelector(".my-trigger-class");
    expect(triggerDiv).not.toBeNull();
    expect(triggerDiv?.classList.contains("inline-flex")).toBe(true);
  });
});

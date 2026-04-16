import { expect, test, describe, afterEach } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Avatar } from "@/components/atoms/Avatar";
import * as React from "react";

afterEach(() => {
  cleanup();
});

describe("Avatar", () => {
  test("renders with fallback initials", () => {
    render(<Avatar fallback="John Doe" />);
    expect(screen.getByText("JD")).toBeDefined();
  });

  test("renders image when src provided", () => {
    render(<Avatar src="https://example.com/photo.jpg" alt="User photo" />);
    const img = screen.getByRole("img");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://example.com/photo.jpg");
  });

  test("falls back on image error", () => {
    const { container } = render(<Avatar src="https://broken.url/img.jpg" fallback="Jane Doe" />);
    const img = container.querySelector("img")!;
    fireEvent.error(img);
    expect(screen.getByText("JD")).toBeDefined();
  });

  test("applies sm size variant", () => {
    render(<Avatar size="sm" fallback="A" />);
    const avatar = screen.getByText("A").closest("div")!;
    expect(avatar.className).toContain("h-8");
    expect(avatar.className).toContain("w-8");
  });

  test("applies md size variant", () => {
    render(<Avatar size="md" fallback="A" />);
    const avatar = screen.getByText("A").closest("div")!;
    expect(avatar.className).toContain("h-10");
    expect(avatar.className).toContain("w-10");
  });

  test("applies lg size variant", () => {
    render(<Avatar size="lg" fallback="A" />);
    const avatar = screen.getByText("A").closest("div")!;
    expect(avatar.className).toContain("h-12");
    expect(avatar.className).toContain("w-12");
  });

  test("applies xl size variant", () => {
    render(<Avatar size="xl" fallback="A" />);
    const avatar = screen.getByText("A").closest("div")!;
    expect(avatar.className).toContain("h-16");
    expect(avatar.className).toContain("w-16");
  });

  test("renders status dot", () => {
    const { container } = render(<Avatar fallback="A" status="online" />);
    const dot = container.querySelector("[aria-label='online']");
    expect(dot).toBeDefined();
    expect(dot!.className).toContain("bg-status-success");
  });

  test("generates initials from name", () => {
    render(<Avatar fallback="Alice Bob" />);
    expect(screen.getByText("AB")).toBeDefined();
  });

  test("shows question mark when no fallback", () => {
    render(<Avatar />);
    expect(screen.getByText("?")).toBeDefined();
  });
});

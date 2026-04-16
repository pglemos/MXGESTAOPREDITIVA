import { expect, test, describe, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { Tooltip } from "@/components/atoms/Tooltip";
import * as React from "react";

afterEach(() => {
  cleanup();
});

describe("Tooltip", () => {
  test("renders children", () => {
    render(<Tooltip content="tip">Hover me</Tooltip>);
    expect(screen.getByText("Hover me")).toBeDefined();
  });

  test("renders tooltip content", () => {
    render(<Tooltip content="My tooltip text">Child</Tooltip>);
    expect(screen.getByText("My tooltip text")).toBeDefined();
  });

  test("applies top position variant", () => {
    render(<Tooltip content="tip" position="top">Child</Tooltip>);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("bottom-full");
  });

  test("applies bottom position variant", () => {
    render(<Tooltip content="tip" position="bottom">Child</Tooltip>);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("top-full");
  });

  test("applies left position variant", () => {
    render(<Tooltip content="tip" position="left">Child</Tooltip>);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("right-full");
  });

  test("applies right position variant", () => {
    render(<Tooltip content="tip" position="right">Child</Tooltip>);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("left-full");
  });

  test("has tooltip role", () => {
    render(<Tooltip content="tip">Child</Tooltip>);
    expect(screen.getByRole("tooltip")).toBeDefined();
  });
});

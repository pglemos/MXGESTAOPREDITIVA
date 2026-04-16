import { expect, test, describe, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { FilterBar } from "@/components/molecules/FilterBar";
import * as React from "react";

afterEach(() => {
  cleanup();
});

describe("FilterBar", () => {
  test("renders label text", () => {
    render(<FilterBar label="Filters" />);
    expect(screen.getByText("Filters")).toBeDefined();
  });

  test("renders icon when provided", () => {
    render(<FilterBar label="Filters" icon={<svg data-testid="filter-icon" />} />);
    expect(screen.getByTestId("filter-icon")).toBeDefined();
  });

  test("renders children (filter buttons)", () => {
    render(
      <FilterBar label="Filters">
        <button>Active</button>
        <button>Inactive</button>
      </FilterBar>
    );
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Inactive")).toBeDefined();
  });

  test("does not render icon when not provided", () => {
    const { container } = render(<FilterBar label="Filters" />);
    const iconSpans = container.querySelectorAll("[data-testid='filter-icon']");
    expect(iconSpans.length).toBe(0);
  });

  test("applies custom className", () => {
    const { container } = render(<FilterBar label="Filters" className="my-custom-class" />);
    expect((container.firstChild as HTMLElement).classList.contains("my-custom-class")).toBe(true);
  });

  test("wraps children in flex container", () => {
    const { container } = render(
      <FilterBar label="Filters">
        <button>A</button>
      </FilterBar>
    );
    const wrapper = container.querySelector(".flex.flex-wrap.items-center.gap-mx-xs");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector("button")).not.toBeNull();
  });
});

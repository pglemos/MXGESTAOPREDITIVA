import { expect, test, describe, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { PageHeader } from "@/components/molecules/PageHeader";
import * as React from "react";

afterEach(() => {
  cleanup();
});

describe("PageHeader", () => {
  test("renders title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeDefined();
  });

  test("renders description", () => {
    render(<PageHeader title="T" description="A page description" />);
    expect(screen.getByText("A page description")).toBeDefined();
  });

  test("renders actions slot", () => {
    render(
      <PageHeader
        title="T"
        actions={<button>New Item</button>}
      />
    );
    expect(screen.getByRole("button", { name: /new item/i })).toBeDefined();
  });

  test("renders breadcrumb", () => {
    render(
      <PageHeader
        title="T"
        breadcrumb={<nav aria-label="Breadcrumb">Home / Page</nav>}
      />
    );
    expect(screen.getByLabelText("Breadcrumb")).toBeDefined();
    expect(screen.getByText("Home / Page")).toBeDefined();
  });

  test("does not render description when omitted", () => {
    render(<PageHeader title="Just Title" />);
    expect(screen.queryByText("Just Title")).toBeDefined();
  });
});

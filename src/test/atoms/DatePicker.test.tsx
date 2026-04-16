import { expect, test, describe, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { DatePicker } from "@/components/atoms/DatePicker";
import * as React from "react";

afterEach(() => {
  cleanup();
});

describe("DatePicker", () => {
  test("renders date input", () => {
    render(<DatePicker />);
    const input = document.querySelector('input[type="date"]');
    expect(input).not.toBeNull();
  });

  test("has type date", () => {
    render(<DatePicker />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input.type).toBe("date");
  });

  test("supports disabled", () => {
    render(<DatePicker disabled />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input.hasAttribute("disabled")).toBe(true);
  });

  test("forwards ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<DatePicker ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current!.tagName).toBe("INPUT");
  });
});

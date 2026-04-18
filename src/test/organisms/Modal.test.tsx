import { expect, test, describe, afterEach, mock } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import * as React from "react";

const DialogContext = React.createContext<{ onOpenChange?: (open: boolean) => void }>({});

mock.module("@radix-ui/react-dialog", () => ({
  Root: ({ children, open, onOpenChange }: any) => {
    if (!open) return null;
    return React.createElement(DialogContext.Provider, { value: { onOpenChange } },
      typeof children === "function" ? children({ open }) : children
    );
  },
  Portal: ({ children }: any) => React.createElement(React.Fragment, null, children),
  Overlay: (props: any) => React.createElement("div", { ...props, "data-testid": "overlay" }),
  Content: ({ asChild, ...props }: any) => React.createElement("div", { ...props }),
  Title: ({ asChild, ...props }: any) => React.createElement("div", { ...props }),
  Description: ({ asChild, ...props }: any) => React.createElement("div", { ...props }),
  Close: ({ children, asChild, ...props }: any) => {
    const { onOpenChange } = React.useContext(DialogContext);
    const handleClick = () => onOpenChange?.(false);
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, { onClick: handleClick });
    }
    return React.createElement("button", { ...props, onClick: handleClick }, children);
  },
}));

import { Modal } from "@/components/organisms/Modal";

afterEach(() => {
  cleanup();
});

describe("Modal", () => {
  test("renders when open", () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        Modal body
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeDefined();
    expect(screen.getByText("Modal body")).toBeDefined();
  });

  test("does not render when closed", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden Modal">
        Hidden body
      </Modal>
    );
    expect(screen.queryByText("Hidden Modal")).toBeNull();
  });

  test("renders title", () => {
    render(
      <Modal open={true} onClose={() => {}} title="My Dialog Title">
        Content
      </Modal>
    );
    expect(screen.getByText("My Dialog Title")).toBeDefined();
  });

  test("renders description", () => {
    render(
      <Modal open={true} onClose={() => {}} title="T" description="A modal description">
        Content
      </Modal>
    );
    expect(screen.getByText("A modal description")).toBeDefined();
  });

  test("renders children", () => {
    render(
      <Modal open={true} onClose={() => {}} title="T">
        <span>Child element</span>
      </Modal>
    );
    expect(screen.getByText("Child element")).toBeDefined();
  });

  test("renders footer", () => {
    render(
      <Modal
        open={true}
        onClose={() => {}}
        title="T"
        footer={<button>Save Changes</button>}
      >
        Content
      </Modal>
    );
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDefined();
  });

  test("applies sm size variant", () => {
    render(
      <Modal open={true} onClose={() => {}} title="T" size="sm">
        Content
      </Modal>
    );
    const content = screen.getByText("T").closest("[class*='max-w']")!;
    expect(content.className).toContain("max-w-md");
  });

  test("applies lg size variant", () => {
    render(
      <Modal open={true} onClose={() => {}} title="T" size="lg">
        Content
      </Modal>
    );
    const content = screen.getByText("T").closest("[class*='max-w']")!;
    expect(content.className).toContain("max-w-xl");
  });

  test("calls onClose when close button clicked", () => {
    const onClose = mock(() => {});
    render(
      <Modal open={true} onClose={onClose} title="T" showClose={true}>
        Content
      </Modal>
    );
    const closeButtons = screen.getAllByRole("button");
    const closeBtn = closeButtons.find((b) => b.querySelector("svg"));
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalled();
  });
});

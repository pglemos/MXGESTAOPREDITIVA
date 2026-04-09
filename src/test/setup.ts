import { Window } from 'happy-dom';
import { expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

declare module "bun:test" {
  interface Matchers<T> extends matchers.TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

const window = new Window();
const globalAny = global as any;

globalAny.window = window;
globalAny.document = window.document;
globalAny.navigator = window.navigator;

globalAny.HTMLInputElement = window.HTMLInputElement;
globalAny.HTMLSelectElement = window.HTMLSelectElement;
globalAny.HTMLElement = window.HTMLElement;
globalAny.Node = window.Node;
globalAny.Text = window.Text;
globalAny.Comment = window.Comment;
globalAny.SVGElement = window.SVGElement;
globalAny.Element = window.Element;
globalAny.DocumentFragment = window.DocumentFragment;
globalAny.Event = window.Event;
globalAny.KeyboardEvent = window.KeyboardEvent;
globalAny.MouseEvent = window.MouseEvent;

// Fix for happy-dom specific issue with SyntaxError
if (!window.SyntaxError) {
    globalAny.window.SyntaxError = SyntaxError;
}

// Mock ResizeObserver
globalAny.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};


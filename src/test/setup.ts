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
// CustomEvent faltava aqui — Radix (react-focus-scope/react-dismissable-layer)
// despacha CustomEvent nos nós do happy-dom; sem esse alias, `instanceof`
// falha contra o CustomEvent global do Bun e o dispatch quebra com
// "TypeError is not a constructor" ao abrir qualquer Modal em telas com
// react-router (2.2.4, auditoria 2026-07-10).
globalAny.CustomEvent = window.CustomEvent;
// NodeFilter também faltava — react-focus-scope usa TreeWalker/NodeFilter
// para varrer nós focáveis dentro do trap de foco do Radix Dialog.
globalAny.NodeFilter = window.NodeFilter;

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

// Mock IntersectionObserver
globalAny.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock matchMedia for motion/react
globalAny.window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
});

// Mock scrollTo
globalAny.window.scrollTo = () => {};

// Mock animation frame APIs used by motion/react in component tests.
globalAny.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 0);
};
globalAny.cancelAnimationFrame = (handle: ReturnType<typeof setTimeout>) => {
    clearTimeout(handle);
};
globalAny.window.requestAnimationFrame = globalAny.requestAnimationFrame;
globalAny.window.cancelAnimationFrame = globalAny.cancelAnimationFrame;

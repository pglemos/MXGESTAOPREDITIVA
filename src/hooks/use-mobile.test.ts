import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
    let originalInnerWidth: number;
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
        originalInnerWidth = window.innerWidth;
        originalMatchMedia = window.matchMedia;
    });

    afterEach(() => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalInnerWidth
        });
        window.matchMedia = originalMatchMedia;
    });

    const setInnerWidth = (width: number) => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width
        });
    };

    it("should return false when screen width is >= 768", () => {
        setInnerWidth(1024);

        let changeListener: any = null;
        window.matchMedia = mock((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: (event: string, listener: any) => {
                if (event === 'change') changeListener = listener;
            },
            removeEventListener: () => {},
            dispatchEvent: () => true,
        })) as any;

        const { result } = renderHook(() => useIsMobile());

        expect(result.current).toBe(false);
    });

    it("should return true when screen width is < 768", () => {
        setInnerWidth(375);

        window.matchMedia = mock((query: string) => ({
            matches: true,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
        })) as any;

        const { result } = renderHook(() => useIsMobile());

        expect(result.current).toBe(true);
    });

    it("should update when window is resized crossing the breakpoint", () => {
        setInnerWidth(1024);

        let changeListener: (() => void) | null = null;

        window.matchMedia = mock((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: (event: string, listener: any) => {
                if (event === 'change') changeListener = listener;
            },
            removeEventListener: () => {},
            dispatchEvent: () => true,
        })) as any;

        const { result } = renderHook(() => useIsMobile());

        expect(result.current).toBe(false);

        // Simulate resize to mobile
        act(() => {
            setInnerWidth(375);
            if (changeListener) {
                changeListener();
            }
        });

        expect(result.current).toBe(true);

        // Simulate resize back to desktop
        act(() => {
            setInnerWidth(1024);
            if (changeListener) {
                changeListener();
            }
        });

        expect(result.current).toBe(false);
    });

    it("should clean up event listener on unmount", () => {
        setInnerWidth(1024);

        const removeEventListenerMock = mock(() => {});
        let changeListener: any = null;

        window.matchMedia = mock((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: (event: string, listener: any) => {
                if (event === 'change') changeListener = listener;
            },
            removeEventListener: removeEventListenerMock,
            dispatchEvent: () => true,
        })) as any;

        const { unmount } = renderHook(() => useIsMobile());

        unmount();

        expect(removeEventListenerMock).toHaveBeenCalledTimes(1);
        expect(removeEventListenerMock).toHaveBeenCalledWith('change', changeListener);
    });
});

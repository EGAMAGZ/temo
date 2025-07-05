import { assertEquals, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { Temo, Theme } from "./temo.ts";

// Create a simple mock documentElement with attribute tracking
const mockDocumentElement = {
  _attributes: {} as Record<string, string>,
  setAttribute: function (name: string, value: string) {
    this._attributes[name] = value;
  },
  getAttribute: function (name: string) {
    return this._attributes[name] || null;
  },
};

// Simple mock elements that can hold event listeners
class MockElement {
  private _listeners: Record<string, { fn: Function; signal?: AbortSignal }[]> =
    {};
  private _id = "";
  private _tagName = "";

  constructor(tagName: string) {
    this._tagName = tagName.toUpperCase();
  }

  setAttribute(name: string, value: string) {
    if (name === "id") {
      this._id = value;
    }
  }

  getAttribute(name: string) {
    if (name === "id") {
      return this._id;
    }
    return null;
  }

  addEventListener(
    type: string,
    listener: Function,
    options?: { signal?: AbortSignal },
  ) {
    if (!this._listeners[type]) {
      this._listeners[type] = [];
    }

    const listenerEntry = { fn: listener, signal: options?.signal };
    this._listeners[type].push(listenerEntry);

    // If signal is provided, listen for abort
    if (options?.signal) {
      const abortHandler = () => {
        this.removeEventListener(type, listener);
      };

      if (options.signal.aborted) {
        // Already aborted, don't add listener
        return;
      }

      // Add abort listener (simplified mock)
      (options.signal as any)._abortListeners =
        (options.signal as any)._abortListeners || [];
      (options.signal as any)._abortListeners.push(abortHandler);
    }
  }

  removeEventListener(type: string, listener: Function) {
    if (this._listeners[type]) {
      this._listeners[type] = this._listeners[type].filter((entry) =>
        entry.fn !== listener
      );
    }
  }

  click() {
    const listeners = this._listeners["click"] || [];
    // Only call listeners that haven't been aborted
    listeners
      .filter((entry) => !entry.signal || !entry.signal.aborted)
      .forEach((entry) => entry.fn());
  }

  get id() {
    return this._id;
  }

  get tagName() {
    return this._tagName;
  }
}

// Mock document with minimal functionality
const mockElements: Record<string, MockElement> = {};

const mockDocument = {
  createElement: (tagName: string) => {
    return new MockElement(tagName);
  },
  getElementById: (id: string) => {
    return mockElements[id] || null;
  },
  documentElement: mockDocumentElement,
  body: {
    appendChild: (element: MockElement) => {
      if (element.id) {
        mockElements[element.id] = element;
      }
    },
    removeChild: (element: MockElement) => {
      if (element.id && mockElements[element.id]) {
        delete mockElements[element.id];
      }
    },
    innerHTML: "",
  },
};

(globalThis as any).document = mockDocument;

// Mock AbortController
class MockAbortController {
  signal: MockAbortSignal;

  constructor() {
    this.signal = new MockAbortSignal();
  }

  abort() {
    this.signal.abort();
  }
}

class MockAbortSignal {
  aborted = false;
  private _abortListeners: Function[] = [];

  abort() {
    this.aborted = true;
    this._abortListeners.forEach((listener) => listener());
  }

  addEventListener(type: string, listener: Function) {
    if (type === "abort") {
      this._abortListeners.push(listener);
    }
  }
}

(globalThis as any).AbortController = MockAbortController;

// Mocking localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  clear() {
    this.store = {};
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
  get length(): number {
    return Object.keys(this.store).length;
  }
}

// Mock matchMedia with configurable behavior
class MediaQueryListMock {
  private listeners: ((e: MediaQueryListEvent) => void)[] = [];

  constructor(public matches: boolean) {}

  addEventListener(
    type: string,
    listener: (e: MediaQueryListEvent) => void,
    options?: any,
  ) {
    this.listeners.push(listener);
  }

  removeEventListener(
    type: string,
    listener: (e: MediaQueryListEvent) => void,
  ) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  dispatchEvent(event: MediaQueryListEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
}

let mockMediaQuery: MediaQueryListMock;
let prefersDark = false; // Default to light theme

(globalThis as any).matchMedia = (query: string) => {
  const matches = query.includes("dark") && prefersDark;
  mockMediaQuery = new MediaQueryListMock(matches);
  return mockMediaQuery;
};

const mockLocalStorage = new LocalStorageMock();

// Override localStorage properly to replace Deno's built-in localStorage
Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

describe("Temo", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();

    // Clear any existing Temo instance
    (Temo as any).instance = null;

    // Clear mock elements and reset documentElement attributes
    Object.keys(mockElements).forEach((key) => delete mockElements[key]);
    mockDocumentElement._attributes = {};

    // Reset prefersDark to default
    prefersDark = false;
  });

  it("should initialize with default theme when no storage exists", () => {
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });
    assertEquals(temo instanceof Temo, true);
    assertEquals(globalThis.localStorage.getItem("theme"), "light");
    assertEquals(document.documentElement.getAttribute("data-theme"), "light");
  });

  it("should initialize with stored theme when available", () => {
    globalThis.localStorage.setItem("theme", "dark");
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });
    assertEquals(globalThis.localStorage.getItem("theme"), "dark");
    assertEquals(document.documentElement.getAttribute("data-theme"), "dark");
  });

  it("should toggle themes correctly", () => {
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });

    // Initial state should be light
    assertEquals(document.documentElement.getAttribute("data-theme"), "light");

    // Toggle to dark
    temo.toggle();
    assertEquals(globalThis.localStorage.getItem("theme"), "dark");
    assertEquals(document.documentElement.getAttribute("data-theme"), "dark");

    // Toggle back to light
    temo.toggle();
    assertEquals(globalThis.localStorage.getItem("theme"), "light");
    assertEquals(document.documentElement.getAttribute("data-theme"), "light");
  });

  it("should call onThemeChange callback when theme changes", () => {
    let callbackTheme: Theme | null = null;
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
      onThemeChange: (theme) => {
        callbackTheme = theme;
      },
    });

    // Initial callback should be called during initialization
    assertEquals(callbackTheme, "light");

    // Toggle and check callback
    temo.toggle();
    assertEquals(callbackTheme, "dark");
  });

  it("should bind and handle toggle button click", () => {
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });

    // Create mock button element
    const mockButton = document.createElement("button");
    mockButton.setAttribute("id", "toggleBtn");
    document.body.appendChild(mockButton);

    temo.bindToggle("#toggleBtn");

    // Initial state should be light
    assertEquals(document.documentElement.getAttribute("data-theme"), "light");

    // Simulate click
    mockButton.click();
    assertEquals(globalThis.localStorage.getItem("theme"), "dark");
    assertEquals(document.documentElement.getAttribute("data-theme"), "dark");

    // Simulate another click
    mockButton.click();
    assertEquals(globalThis.localStorage.getItem("theme"), "light");
    assertEquals(document.documentElement.getAttribute("data-theme"), "light");
  });

  it("should throw error for invalid selector", () => {
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });

    assertThrows(
      () => temo.bindToggle(".invalid" as any),
      Error,
      "Invalid selector '.invalid'. Only ID selectors (e.g., '#id') are supported.",
    );
  });

  it("should throw error for non-existent element", () => {
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });

    assertThrows(
      () => temo.bindToggle("#nonExistent"),
      Error,
      "Element with ID 'nonExistent' not found in the DOM.",
    );
  });

  it("should throw error for non-button element", () => {
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });

    // Create mock div element
    const mockDiv = document.createElement("div");
    mockDiv.setAttribute("id", "divElement");
    document.body.appendChild(mockDiv);

    assertThrows(
      () => temo.bindToggle("#divElement"),
      Error,
      "Element with ID 'divElement' is not a button element. Only button elements are supported.",
    );
  });

  it("should throw error for span element", () => {
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });

    // Create mock span element
    const mockSpan = document.createElement("span");
    mockSpan.setAttribute("id", "spanElement");
    document.body.appendChild(mockSpan);

    assertThrows(
      () => temo.bindToggle("#spanElement"),
      Error,
      "Element with ID 'spanElement' is not a button element. Only button elements are supported.",
    );
  });

  it("should accept button element with different casing", () => {
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });

    // Create mock button element
    const mockButton = document.createElement("BuTtOn"); // Mixed case
    mockButton.setAttribute("id", "mixedCaseBtn");
    document.body.appendChild(mockButton);

    // Should not throw
    temo.bindToggle("#mixedCaseBtn");

    // Verify it works
    assertEquals(document.documentElement.getAttribute("data-theme"), "light");
    mockButton.click();
    assertEquals(document.documentElement.getAttribute("data-theme"), "dark");
  });

  it("should use custom storage key", () => {
    const customKey = "custom-theme-key";
    const temo = Temo.init({
      defaultTheme: "dark",
      storageKey: customKey,
      autoDetect: false,
    });

    assertEquals(globalThis.localStorage.getItem(customKey), "dark");
    assertEquals(globalThis.localStorage.getItem("theme"), null);
  });

  it("should be singleton - return same instance", () => {
    const temo1 = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });
    const temo2 = Temo.init({
      defaultTheme: "dark",
      storageKey: "other",
      autoDetect: true,
    });

    assertEquals(temo1, temo2);
    // Should keep the first configuration (light theme, no autoDetect)
    assertEquals(globalThis.localStorage.getItem("theme"), "light");
    // Should not have stored anything with the "other" key
    assertEquals(globalThis.localStorage.getItem("other"), null);
  });

  it("should destroy and clean up event listeners", () => {
    const temo = Temo.init({
      defaultTheme: "light",
      storageKey: "theme",
      autoDetect: false,
    });

    // Create and bind button
    const mockButton = document.createElement("button");
    mockButton.setAttribute("id", "toggleBtn");
    document.body.appendChild(mockButton);
    temo.bindToggle("#toggleBtn");

    // Initial theme should be set
    assertEquals(document.documentElement.getAttribute("data-theme"), "light");

    // Destroy should not throw
    temo.destroy();

    // After destroy, clicking should not change theme
    const initialTheme = document.documentElement.getAttribute("data-theme");
    mockButton.click();
    assertEquals(
      document.documentElement.getAttribute("data-theme"),
      initialTheme,
    );
  });

  it("should auto-detect dark theme preference and handle media query changes", () => {
    prefersDark = true; // Set mock to prefer dark theme
    const temo = Temo.init({
      autoDetect: true,
      storageKey: "theme",
      defaultTheme: "light",
    });
    assertEquals(globalThis.localStorage.getItem("theme"), "dark");
    assertEquals(document.documentElement.getAttribute("data-theme"), "dark");

    // Simulate media query change to light
    if (mockMediaQuery) {
      mockMediaQuery.matches = false;
      mockMediaQuery.dispatchEvent({ matches: false } as MediaQueryListEvent);
      assertEquals(
        document.documentElement.getAttribute("data-theme"),
        "light",
      );
    }

    prefersDark = false; // Reset for other tests
  });
});

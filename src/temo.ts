const ID_ELEMENT_REGEX = /^#[^#\s]+$/;

/**
 * Represents the available theme options for the application.
 */
export type Theme = "light" | "dark";

/**
 * Represents a CSS ID selector string that starts with '#'.
 * Used for selecting DOM elements by their ID attribute.
 */
export type Selector = `#${string}`;

/**
 * Configuration interface for initializing the Temo theme manager.
 * All properties are optional and have sensible defaults.
 */
export interface TemoConfigInit {
  /**
   * Whether to automatically detect and sync with the user's system theme preference.
   * @default true
   */
  autoDetect?: boolean;

  /**
   * The default theme to use when no theme is stored and auto-detection is disabled.
   * @default "light"
   */
  defaultTheme?: Theme;

  /**
   * The key used to store the current theme in localStorage.
   * @default "theme"
   */
  storageKey?: string;

  /**
   * Callback function that is called whenever the theme changes.
   * @param theme - The new theme that was applied
   */
  onThemeChange?: (theme: Theme) => void;
}

/**
 * Temo - Theme manager for toggling between light and dark modes.
 * @example
 * ```ts
 * // HTML: <button id="toggleBtn">Toggle Theme</button>
 *
 * const temo = Temo.init({
 *   autoDetect: true,
 *   defaultTheme: "light",
 *   storageKey: "theme",
 *   onThemeChange: (theme) => {
 *     console.log("Theme changed to", theme);
 *   },
 * });
 *
 * temo.bindToggle("#toggleBtn"); // Only works with button elements
 *
 * temo.toggle();
 *
 * temo.destroy();
 * ```
 */
export class Temo {
  private abortController = new AbortController();
  private static instance: Temo;
  private currentTheme: Theme;
  private config: Required<TemoConfigInit>;

  /**
   * @param {Required<TemoConfigInit>} config - The configuration object for Temo (all required).
   */
  private constructor(config: Required<TemoConfigInit>) {
    this.config = config;
    this.currentTheme = this.resolveInitTheme();
    this.setTheme(this.currentTheme);

    if (this.config.autoDetect) {
      this.setupAutoDetection();
    }
  }

  /**
   * Determines the initial theme based on storage, auto-detection, or default.
   */
  private resolveInitTheme(): Theme {
    const storedTheme = localStorage.getItem(this.config.storageKey) as
      | Theme
      | null;
    if (storedTheme) return storedTheme;

    if (this.config.autoDetect) {
      const prefersDark =
        globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }

    return this.config.defaultTheme;
  }

  /**
   * Sets the current theme, updates DOM and storage, and triggers callback.
   * @param {Theme} theme - The theme to set.
   */
  private setTheme(theme: Theme): void {
    this.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(this.config.storageKey, theme);
    this.config.onThemeChange?.(theme);
  }

  /**
   * Sets up automatic theme detection based on system preferences.
   */
  private setupAutoDetection(): void {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      this.setTheme(newTheme);
    };

    mediaQuery.addEventListener("change", listener, {
      signal: this.abortController.signal,
    });
  }

  /**
   * Initializes the Temo singleton with the given configuration.
   * @param {TemoConfigInit} config - Partial configuration for Temo.
   * @returns {this} The Temo instance.
   */
  public static init(
    {
      autoDetect = true,
      defaultTheme = "light",
      onThemeChange = () => {},
      storageKey = "theme",
    }: TemoConfigInit = {},
  ): Temo {
    if (!Temo.instance) {
      Temo.instance = new Temo({
        autoDetect,
        defaultTheme,
        onThemeChange,
        storageKey,
      });
    }

    return Temo.instance;
  }

  /**
   * Binds a click event to the button element with the given ID selector to toggle theme.
   * @param {Selector} buttonSelector - The ID selector for a button element (e.g., '#toggleBtn').
   * @throws {Error} If the selector is invalid, element is not found, or element is not a button.
   */
  public bindToggle(buttonSelector: Selector): void {
    const trimmedSelector = buttonSelector.trim();
    if (!ID_ELEMENT_REGEX.test(trimmedSelector)) {
      throw new Error(
        `Invalid selector '${buttonSelector}'. Only ID selectors (e.g., '#id') are supported.`,
      );
    }

    const elementId = trimmedSelector.slice(1);
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found in the DOM.`);
    }

    if (element.tagName.toLowerCase() !== "button") {
      throw new Error(
        `Element with ID '${elementId}' is not a button element. Only button elements are supported.`,
      );
    }

    element.addEventListener("click", () => this.toggle(), {
      signal: this.abortController.signal,
    });
  }

  /**
   * Toggles between light and dark themes.
   */
  public toggle(): void {
    this.setTheme(this.currentTheme === "light" ? "dark" : "light");
  }

  /**
   * Cleans up event listeners and aborts any ongoing operations.
   */
  public destroy(): void {
    this.abortController.abort();
  }
}

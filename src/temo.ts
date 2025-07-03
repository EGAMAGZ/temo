const ID_ELEMENT_REGEX = /^#[^#\s]+$/;

export type Theme = "light" | "dark";

export interface TemoConfigInit {
  autoDetect?: boolean;
  defaultTheme?: Theme;
  storageKey?: string;
  onThemeChange?: (theme: Theme) => void;
}

/**
 * Temo - Theme manager for toggling between light and dark modes.
 * @example
 * ```ts
 * const temo = Temo.init({
 *   autoDetect: true,
 *   defaultTheme: "light",
 *   storageKey: "theme",
 *   onThemeChange: (theme) => {
 *     console.log("Theme changed to", theme);
 *   },
 * });
 *
 * temo.bindToggle("#toggleBtn");
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
   * @param config - The configuration object for Temo (all required).
   */
  private constructor(config: Required<TemoConfigInit>) {
    this.config = config;
    this.currentTheme = this.resolveInitTheme();

    if (this.config.autoDetect) {
      this.setupAutoDetection();
    }
  }

  /**
   * Determines the initial theme based on storage, auto-detection, or default.
   */
  private resolveInitTheme(): Theme {
    const storedTheme = localStorage.getItem(this.config.storageKey) as Theme | null;
    if (storedTheme) return storedTheme;

    if (this.config.autoDetect) {
      const prefersDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }

    return this.config.defaultTheme;
  }

  /**
   * Sets the current theme, updates DOM and storage, and triggers callback.
   * @param theme - The theme to set.
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
   * @param config - Partial configuration for Temo.
   * @returns The Temo instance.
   */
  public static init(config: TemoConfigInit): Temo {
    if (!Temo.instance) {
      const {
        autoDetect = true,
        defaultTheme = "light",
        onThemeChange = () => { },
        storageKey = "theme",
      } = config;
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
   * Binds a click event to the element with the given ID selector to toggle theme.
   * @param buttonSelector - The ID selector (e.g., '#toggleBtn').
   */
  public bindToggle(buttonSelector: string): void {
    const trimmedSelector = buttonSelector.trim();
    if (!ID_ELEMENT_REGEX.test(trimmedSelector)) {
      throw new Error(
        `Invalid selector '${buttonSelector}'. Only ID selectors (e.g., '#id') are supported.`
      );
    }

    const elementId = trimmedSelector.slice(1);
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found in the DOM.`);
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

const ID_ELEMENT_REGEX = /^#[^#\s]+$/;

export type Theme = "light" | "dark";

export interface TemoConfigInit {
  autoDetect?: boolean;
  defaultTheme?: Theme;
  storageKey?: string;
  onThemeChange?: (theme: Theme) => void;
}

export class Temo {
  private abortController = new AbortController();
  private static instance: Temo;
  private currentTheme: Theme;
  private config: Required<TemoConfigInit>;

  private constructor(config: Required<TemoConfigInit>) {
    this.config = config;
    this.currentTheme = this.resolveInitTheme();

    if (this.config.autoDetect) {
      this.setupAutoDetection();
    }
  }

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

  private setTheme(theme: Theme): void {
    this.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(this.config.storageKey, theme);
    this.config.onThemeChange?.(theme);
  }

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

  public static init(
    config: TemoConfigInit,
  ): Temo {
    if (!Temo.instance) {
      const {
        autoDetect = true,
        defaultTheme = "light",
        onThemeChange = () => {},
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

  bindToggle(buttonSelector: string) {
    if (!ID_ELEMENT_REGEX.test(buttonSelector.trim())) {
      throw new Error(
        `Element with ID '${buttonSelector}' not found in the DOM.`,
      );
    }

    const elementId = buttonSelector.trim().slice(1);
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found in the DOM.`);
    }

    element.addEventListener("click", () => this.toggle(), {
      signal: this.abortController.signal,
    });
  }

  public toggle() {
    this.setTheme(this.currentTheme === "light" ? "dark" : "light");
  }

  public destroy() {
    this.abortController.abort();
  }
}

const ID_ELEMENT_REGEX = /^#[^#\s]+$/;

export type Theme = "light" | "dark";

export interface TemoConfigInit {
  autoDetect?: boolean;
  defaultTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export class Temo {
  private abortController = new AbortController();
  private static instance: Temo;
  private currentTheme: Theme;
  private config: Required<TemoConfigInit>;

  private constructor(config: Required<TemoConfigInit>) {
    this.config = config;
    this.currentTheme = config.defaultTheme;
  }

  private applyTheme(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  public static init(
    config: TemoConfigInit,
  ): Temo {
    if (!Temo.instance) {
      const {
        autoDetect = true,
        defaultTheme = "light",
        onThemeChange = () => {},
      } = config;
      Temo.instance = new Temo({
        autoDetect,
        defaultTheme,
        onThemeChange,
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
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme(this.currentTheme);
    this.config.onThemeChange(this.currentTheme);
  }
  public destroy() {
    this.abortController.abort();
  }
}

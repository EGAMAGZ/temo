export type Theme = "light" | "dark";

export interface TemoConfigInit {
  autoDetect?: boolean;
  defaultTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export class Temo {
  private buttonIds: string[] = [];
  static instance: Temo;

  private config: TemoConfigInit;

  private constructor(config: TemoConfigInit) {
    this.config = config;
  }

  public static init(
    {
      autoDetect = true,
      defaultTheme = "light",
      onThemeChange = (_theme: Theme) => {},
    }: TemoConfigInit,
  ): Temo {
    if (!Temo.instance) {
      Temo.instance = new Temo({
        autoDetect,
        defaultTheme,
        onThemeChange,
      });
    }

    return Temo.instance;
  }

  bindToggle(buttonId: string) {
    if (/^#[^#\s]+$/.test(buttonId)) throw new Error("Invalid");

    if (this.buttonIds.includes(buttonId)) throw new Error("Binding");
  }
  toggle() {
  }
}

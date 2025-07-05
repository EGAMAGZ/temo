# Temo

[![JSR](https://jsr.io/badges/@egamagz/temo)](https://jsr.io/@egamagz/temo)
[![JSR Score](https://jsr.io/badges/@egamagz/temo/score)](https://jsr.io/@egamagz/temo/score)
![GitHub License](https://img.shields.io/github/license/egamagz/temo)
![GitHub Release](https://img.shields.io/github/v/release/egamagz/temo)

## Installation

### For Deno

```bash
deno add jsr:@egamagz/temo
```

### For Node.js

```bash
npx jsr add @egamagz/temo
```

### For Bun

```bash
bunx jsr add @egamagz/temo
```

### For other package managers

Check the [JSR page for more details](https://jsr.io/@egamagz/temo).

## Features

- 🌙 **Light/Dark Theme Toggle**: Seamlessly switch between light and dark
  themes
- 🔍 **Auto-Detection**: Automatically detects user's system theme preference
- 💾 **Persistent Storage**: Remembers user's theme choice using localStorage
- 🎯 **Simple API**: Easy-to-use singleton pattern with minimal configuration
- 🔗 **Element Binding**: Bind theme toggle to any button element
- 🎨 **Custom Storage Key**: Use custom localStorage keys for theme storage
- 🔄 **Theme Change Callbacks**: React to theme changes with custom callbacks
- 🧹 **Clean Destruction**: Properly clean up event listeners when needed

## Usage

### Basic Usage

```typescript
import { Temo } from "@egamagz/temo";

// Initialize with default configuration
const temo = Temo.init({
  autoDetect: true, // Auto-detect system theme preference
  defaultTheme: "light", // Default theme when no preference is found
  storageKey: "theme", // localStorage key for theme persistence
});

// Toggle theme programmatically
temo.toggle();
```

### Advanced Configuration

```typescript
import { Temo } from "@egamagz/temo";

const temo = Temo.init({
  autoDetect: true,
  defaultTheme: "dark",
  storageKey: "my-app-theme",
  onThemeChange: (theme) => {
    console.log(`Theme changed to: ${theme}`);
    // Update other UI elements based on theme
    updateNavbarStyle(theme);
  },
});
```

### Binding to Toggle Button

```typescript
// HTML
// <button id="theme-toggle">Toggle Theme</button>

// JavaScript/TypeScript
const temo = Temo.init({
  autoDetect: true,
  defaultTheme: "light",
});

// Bind the toggle functionality to a button
temo.bindToggle("#theme-toggle");
```

### CSS Implementation

Temo sets a `data-theme` attribute on the document element. Use this in your
CSS:

```css
/* Light theme (default) */
:root {
  --bg-color: #ffffff;
  --text-color: #000000;
  --accent-color: #007bff;
}

/* Dark theme */
[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
  --accent-color: #66b3ff;
}

/* Apply the variables */
body {
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.button {
  background-color: var(--accent-color);
  color: var(--bg-color);
}
```

## API Reference

### `Temo.init(config: TemoConfigInit): Temo`

Initializes the Temo singleton instance.

**Parameters:**

- `config.autoDetect?: boolean` - Enable automatic system theme detection
  (default: `true`)
- `config.defaultTheme?: "light" | "dark"` - Default theme when no preference is
  found (default: `"light"`)
- `config.storageKey?: string` - localStorage key for theme persistence
  (default: `"theme"`)
- `config.onThemeChange?: (theme: Theme) => void` - Callback function called
  when theme changes

### `temo.toggle(): void`

Toggles between light and dark themes.

### `temo.bindToggle(selector: Selector): void`

Binds theme toggle functionality to an element.

**Parameters:**

- `selector: Selector` - ID selector (e.g., `"#toggleBtn"`)

### `temo.destroy(): void`

Cleans up event listeners and aborts any ongoing operations.

## License

MIT License

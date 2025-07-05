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

### Complete Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Temo Example</title>
    <style>
      :root {
        --bg-color: #ffffff;
        --text-color: #333333;
        --button-bg: #007bff;
        --button-text: #ffffff;
      }

      [data-theme="dark"] {
        --bg-color: #1a1a1a;
        --text-color: #e0e0e0;
        --button-bg: #66b3ff;
        --button-text: #000000;
      }

      body {
        background-color: var(--bg-color);
        color: var(--text-color);
        font-family: Arial, sans-serif;
        padding: 2rem;
        transition: all 0.3s ease;
      }

      .theme-toggle {
        background-color: var(--button-bg);
        color: var(--button-text);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      }
    </style>
  </head>
  <body>
    <h1>Temo Theme Manager Demo</h1>
    <p>This page demonstrates the Temo theme manager.</p>
    <button id="theme-toggle" class="theme-toggle">🌙 Toggle Theme</button>

    <script type="module">
      import { Temo } from "@egamagz/temo";

      // Initialize Temo
      const temo = Temo.init({
        autoDetect: true,
        defaultTheme: "light",
        storageKey: "demo-theme",
        onThemeChange: (theme) => {
          const button = document.getElementById("theme-toggle");
          button.textContent = theme === "dark"
            ? "☀️ Toggle Theme"
            : "🌙 Toggle Theme";
        },
      });

      // Bind toggle button
      temo.bindToggle("#theme-toggle");

      // Set initial button text
      const currentTheme = localStorage.getItem("demo-theme") ||
        "light";
      const button = document.getElementById("theme-toggle");
      button.textContent = currentTheme === "dark"
        ? "☀️ Toggle Theme"
        : "🌙 Toggle Theme";
    </script>
  </body>
</html>
```

### React Integration

```tsx
import { useEffect } from "react";
import { Temo } from "@egamagz/temo";

function ThemeProvider({ children }) {
  useEffect(() => {
    const temo = Temo.init({
      autoDetect: true,
      defaultTheme: "light",
      storageKey: "react-app-theme",
      onThemeChange: (theme) => {
        // Update React state or context if needed
        console.log("Theme changed to:", theme);
      },
    });

    // Cleanup on unmount
    return () => {
      temo.destroy();
    };
  }, []);

  return <>{children}</>;
}

function ThemeToggleButton() {
  const handleToggle = () => {
    const temo = Temo.init({}); // Get existing instance
    temo.toggle();
  };

  return (
    <button onClick={handleToggle}>
      Toggle Theme
    </button>
  );
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

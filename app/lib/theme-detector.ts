// ============================================================
// Theme Detector — Auto-detect store's theme colors & fonts
// ============================================================

import type { FormStyle } from "./form-engine";

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  buttonBg: string;
  buttonText: string;
  fontFamily: string;
}

/**
 * Detect the active theme's colors and fonts from settings_data.json
 */
export async function detectThemeStyle(admin: any): Promise<Partial<FormStyle>> {
  try {
    // Get the active theme
    const themeResponse = await admin.graphql(`
      query GetActiveTheme {
        themes(first: 1, roles: MAIN) {
          nodes {
            id
            name
          }
        }
      }
    `);

    const themeData = await themeResponse.json();
    const theme = themeData?.data?.themes?.nodes?.[0];
    if (!theme) return {};

    // Get theme settings
    const assetResponse = await admin.graphql(
      `query GetThemeSettings($themeId: ID!) {
        theme(id: $themeId) {
          files(filenames: ["config/settings_data.json"], first: 1) {
            nodes {
              body {
                ... on OnlineStoreThemeFileBodyText {
                  content
                }
              }
            }
          }
        }
      }`,
      { variables: { themeId: theme.id } }
    );

    const assetData = await assetResponse.json();
    const settingsContent = assetData?.data?.theme?.files?.nodes?.[0]?.body?.content;

    if (!settingsContent) return {};

    const settings = JSON.parse(settingsContent);
    const current = settings?.current || {};

    // Extract colors from common Shopify theme settings
    const colors = extractColors(current);

    return {
      backgroundColor: colors.background || "#ffffff",
      textColor: colors.text || "#1a1a2e",
      accentColor: colors.primary || "#6c5ce7",
      buttonColor: colors.buttonBg || colors.primary || "#6c5ce7",
      buttonTextColor: colors.buttonText || "#ffffff",
      borderColor: lightenColor(colors.text || "#1a1a2e", 0.8),
      fontFamily: colors.fontFamily || "Inter, sans-serif",
    };
  } catch (error) {
    console.error("Error detecting theme style:", error);
    return {};
  }
}

/**
 * Extract color values from theme settings (handles various theme structures)
 */
function extractColors(settings: any): ThemeColors {
  // Common Shopify theme setting keys
  const colorKeys = {
    primary: [
      "colors_accent_1", "color_schemes.scheme-1.settings.accent_1",
      "color_primary", "accent_color", "primary_color"
    ],
    background: [
      "colors_background_1", "color_schemes.scheme-1.settings.background",
      "color_background", "background_color", "bg_color"
    ],
    text: [
      "colors_text", "color_schemes.scheme-1.settings.foreground",
      "color_text", "text_color", "body_color"
    ],
    button: [
      "colors_solid_button_labels", "button_color", "btn_color"
    ],
  };

  const findColor = (keys: string[]): string => {
    for (const key of keys) {
      const value = getNestedValue(settings, key);
      if (value && typeof value === "string" && value.startsWith("#")) {
        return value;
      }
    }
    return "";
  };

  // Try to detect font family
  let fontFamily = "Inter, sans-serif";
  const fontKeys = ["type_body_font", "body_font", "font_body"];
  for (const key of fontKeys) {
    const val = getNestedValue(settings, key);
    if (val && typeof val === "string") {
      // Shopify stores fonts as "font_family_name_n4" format
      const fontName = val.split("_n")[0]?.replace(/_/g, " ");
      if (fontName) fontFamily = `${fontName}, sans-serif`;
      break;
    }
  }

  return {
    primary: findColor(colorKeys.primary),
    secondary: "",
    background: findColor(colorKeys.background),
    text: findColor(colorKeys.text),
    buttonBg: findColor(colorKeys.button) || findColor(colorKeys.primary),
    buttonText: "#ffffff",
    fontFamily,
  };
}

/** Get nested value from an object using dot notation */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

/** Lighten a hex color */
function lightenColor(hex: string, factor: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lr = Math.round(r + (255 - r) * factor);
    const lg = Math.round(g + (255 - g) * factor);
    const lb = Math.round(b + (255 - b) * factor);
    return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
  } catch {
    return "#e0e0e0";
  }
}

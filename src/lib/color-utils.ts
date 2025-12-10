// src/lib/color-utils.ts

const HEX_COLOR_REGEX_VALIDATOR = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Converts a HEX color string to an RGB object.
 * @param hex The hex color string (e.g., "#RRGGBB" or "#RGB").
 * @returns An object with r, g, b properties, or null if the hex is invalid.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || !HEX_COLOR_REGEX_VALIDATOR.test(hex)) {
    return null;
  }

  let r = 0, g = 0, b = 0;

  // Handle shorthand hex codes (#RGB)
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) { // Handle full hex codes (#RRGGBB)
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else {
      return null; // Should not happen due to regex, but for safety
  }

  return { r, g, b };
}

/**
 * Determines a contrasting text color (black or white based on CSS variables) for a given HEX background color.
 * @param hexColor The background color in HEX format (e.g., "#RRGGBB" or "#RGB").
 * @returns 'hsl(var(--foreground))' (typically dark) or 'hsl(var(--primary-foreground))' (typically light).
 */
export function getContrastTextColor(hexColor?: string): string {
  if (!hexColor || !HEX_COLOR_REGEX_VALIDATOR.test(hexColor)) {
    return 'hsl(var(--foreground))'; 
  }

  try {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return 'hsl(var(--foreground))';

    // Formula for luminance (YIQ Equation variant)
    const luminance = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

    // Threshold can be adjusted (128 is common for 0-255 range)
    return luminance >= 128 ? 'hsl(var(--foreground))' : 'hsl(var(--primary-foreground))';
  } catch (e) {
    console.error("Error calculating contrast text color for HEX:", hexColor, e);
    return 'hsl(var(--foreground))'; 
  }
}

/**
 * Converts a HEX color string to its HSL numeric components.
 * @param hex The HEX color string (e.g., "#RRGGBB" or "#RGB").
 * @returns An object with h, s, l numeric components, or null if conversion fails.
 *          Hue is 0-360, Saturation and Lightness are 0-100.
 */
export function hexToHslParts(hex?: string | null): { h: number; s: number; l: number } | null {
  if (!hex || !HEX_COLOR_REGEX_VALIDATOR.test(hex)) {
    return null;
  }

  let r_norm = 0, g_norm = 0, b_norm = 0;
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  r_norm = rgb.r / 255;
  g_norm = rgb.g / 255;
  b_norm = rgb.b / 255;

  const max = Math.max(r_norm, g_norm, b_norm);
  const min = Math.min(r_norm, g_norm, b_norm);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r_norm: h = (g_norm - b_norm) / d + (g_norm < b_norm ? 6 : 0); break;
      case g_norm: h = (b_norm - r_norm) / d + 2; break;
      case b_norm: h = (r_norm - g_norm) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}


/**
 * Converts an HSL color value to HEX. Conversion formula
 * adapted from https://www.30secondsofcode.org/js/s/hsl-to-hex.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns a 6-digit Hex string.
 *
 * @param   h       The hue
 * @param   s       The saturation
 * @param   l       The lightness
 * @return  String  The HEX representation
 */
function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [0, 8, 4]
        .map(n => Math.round(f(n) * 255).toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Converts an HSL color string (like "222.2 47.4% 11.2%") to a HEX string.
 * @param hslString The HSL string from CSS variables.
 * @returns The HEX color string (e.g., "#RRGGBB") or an empty string if conversion fails.
 */
export function hslStringToHex(hslString: string): string {
    if (!hslString || hslString.trim() === '') return ''; // Adicionado para evitar erro em strings vazias
    const parts = hslString.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '';

    try {
        const h = parseFloat(parts[0]);
        const s = parseFloat(parts[1]);
        const l = parseFloat(parts[2]);
        const hex = hslToHex(h, s, l);
        return `#${hex}`;
    } catch (e) {
        console.error("Could not convert HSL string to HEX:", hslString, e);
        return '';
    }
}

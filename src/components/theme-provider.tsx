// src/components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // A correção principal: definir o storageKey como 'theme' instrui o next-themes
  // a usar um cookie com esse nome, o que permite a renderização correta no lado do servidor.
  return <NextThemesProvider {...props} storageKey="theme">{children}</NextThemesProvider>
}

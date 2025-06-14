"use client"

import type React from "react"
import { createContext, useContext } from "react"

type Theme = "light"

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme: Theme = "light"

    const toggleTheme = () => {
        // Função mantida vazia pois não há mais alternância de tema
    }

    const setTheme = () => {
        // Função mantida vazia pois não há mais alteração de tema
    }

    const value = {
        theme,
        toggleTheme,
        setTheme,
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error("useTheme deve ser usado dentro de um ThemeProvider")
    }
    return context
}


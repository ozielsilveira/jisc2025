"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light")
    const { user } = useAuth()

    // Carregar tema do localStorage ao iniciar
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") as Theme
        if (storedTheme) {
            setTheme(storedTheme)
            document.documentElement.classList.toggle("dark", storedTheme === "dark")
        }
    }, [])

    // Carregar tema do banco de dados quando o usuário estiver autenticado
    useEffect(() => {
        const loadUserTheme = async () => {
            if (!user) return

            try {
                const { data, error } = await supabase
                    .from("user_settings")
                    .select("theme_preference")
                    .eq("user_id", user.id)
                    .maybeSingle()

                if (error) {
                    console.error("Erro ao carregar tema do usuário:", error)
                    return
                }

                if (data && data.theme_preference) {
                    const userTheme = data.theme_preference === "dark" ? "dark" : "light"
                    setTheme(userTheme)
                    localStorage.setItem("theme", userTheme)
                    document.documentElement.classList.toggle("dark", userTheme === "dark")
                }
            } catch (error) {
                console.error("Erro ao carregar configurações de tema:", error)
            }
        }

        loadUserTheme()
    }, [user])

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light"
        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)
        document.documentElement.classList.toggle("dark", newTheme === "dark")

        // Salvar preferência no banco de dados se o usuário estiver autenticado
        if (user) {
            try {
                const { data, error } = await supabase.from("user_settings").select("id").eq("user_id", user.id).maybeSingle()

                if (error) {
                    console.error("Erro ao verificar configurações do usuário:", error)
                    return
                }

                if (data) {
                    // Atualizar configuração existente
                    await supabase.from("user_settings").update({ theme_preference: newTheme }).eq("id", data.id)
                } else {
                    // Criar nova configuração
                    await supabase.from("user_settings").insert({
                        user_id: user.id,
                        theme_preference: newTheme,
                        notification_email: true,
                        notification_push: true,
                        language: "pt-BR",
                    })
                }
            } catch (error) {
                console.error("Erro ao salvar preferência de tema:", error)
            }
        }
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


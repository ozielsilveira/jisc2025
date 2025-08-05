"use client"

import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import * as Icons from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type UserRole = "buyer" | "athlete" | "athletic" | "admin"

interface DashboardSidebarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function DashboardSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: DashboardSidebarProps) {
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single()
        if (error) throw error
        setUserRole(data.role as UserRole)
      } catch (error) {
        console.error("Error fetching user role:", error)
      }
    }
    fetchUserRole()
  }, [user])

  const navItems = [
    {
      category: "Principal",
      items: [
        { label: "Dashboard", icon: "Home", href: "/dashboard", roles: ["buyer", "athlete", "athletic", "admin"] },
        { label: "Cadastro", icon: "User", href: "/dashboard/profile", roles: ["athlete"] },
      ]
    },
    {
      category: "Gestão",
      items: [
        { label: "Ingressos", icon: "Ticket", href: "/dashboard/tickets", roles: [ "athletic", "admin"] },
        { label: "Atletas", icon: "Medal", href: "/dashboard/athletes", roles: ["athletic", "admin"] },
        { label: "Atléticas", icon: "Trophy", href: "/dashboard/athletics", roles: ["admin"] },
        { label: "Modalidades", icon: "Users", href: "/dashboard/sports", roles: ["admin"] },
      ]
    },
    {
      category: "Competição",
      items: [
        // { label: "Jogos", icon: "Calendar", href: "/dashboard/games", roles: ["admin"] },
        { label: "Pacotes", icon: "Package", href: "/dashboard/packages", roles: ["athletic", "admin"] },
        //{ label: "Atribuir Pacotes", icon: "Tag", href: "/dashboard/assign-packages", roles: ["athletic", "admin"] },
      ]
    },
    {
      category: "Financeiro",
      items: [
        { label: "Pagamentos", icon: "CreditCard", href: "/dashboard/payments", roles: ["admin"] },
        { label: "Aprovar PIX", icon: "QrCode", href: "/dashboard/approve-pix", roles: ["admin"] },
        { label: "Configurar PIX", icon: "QrCode", href: "/dashboard/pix-settings", roles: ["athletic"] },
      ]
    },
    {
      category: "Configurações",
      items: [
        { label: "Configurações", icon: "Settings", href: "/dashboard/settings", roles: ["athletic", "admin"] },
      ]
    }
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-gray-900">
      <div className="p-4 text-center border-b">
        <h2 className="text-2xl font-bold text-[#0456FC]">JISC</h2>
        <p className="text-sm text-gray-500">Campeonato Universitário</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navItems.map((category) => {
          const filteredItems = category.items.filter(item => userRole && item.roles.includes(userRole))
          if (filteredItems.length === 0) return null

          return (
            <div key={category.category} className="nav-category">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                {category.category}
              </h3>
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-item flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200 ${pathname === item.href
                        ? 'bg-[#0456FC] text-white shadow-lg transform scale-102'
                        : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 mb-2"
          onClick={signOut}
        >
          <Icons.LogOut className="mr-2 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {isMobileMenuOpen ? <Icons.X className="h-5 w-5" /> : <Icons.Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar with Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
        {/* Sidebar */}
        <div
          className={`relative z-10 h-full w-64 transform bg-white transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 h-screen sticky top-0 shadow-lg">
        <SidebarContent />
      </aside>
    </>
  )
}
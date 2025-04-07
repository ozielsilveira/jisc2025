"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/theme-context"
import { supabase } from "@/lib/supabase"
import * as Icons from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type UserRole = "buyer" | "athlete" | "athletic" | "admin"

export default function DashboardSidebar() {
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return
      const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single()
      if (!error) setUserRole(data.role as UserRole)
    }
    fetchUserRole()
  }, [user])

  const navItems = [
    {
      category: "Principal",
      items: [
        { label: "Dashboard", icon: "Home", href: "/dashboard", roles: ["buyer", "athlete", "athletic", "admin"] },
        { label: "Meu Perfil", icon: "User", href: "/dashboard/profile", roles: ["buyer", "athlete", "athletic", "admin"] },
      ]
    },
    {
      category: "Gestão",
      items: [
        { label: "Ingressos", icon: "Ticket", href: "/dashboard/tickets", roles: ["buyer", "athlete", "athletic", "admin"] },
        { label: "Atletas", icon: "Medal", href: "/dashboard/athletes", roles: ["athletic", "admin"] },
        { label: "Atléticas", icon: "Trophy", href: "/dashboard/athletics", roles: ["admin"] },
        { label: "Modalidades", icon: "Users", href: "/dashboard/sports", roles: ["admin"] },
      ]
    },
    {
      category: "Competição",
      items: [
        { label: "Jogos", icon: "Calendar", href: "/dashboard/games", roles: ["athlete", "athletic", "admin"] },
        { label: "Pacotes", icon: "Package", href: "/dashboard/packages", roles: ["admin"] },
        //{ label: "Atribuir Pacotes", icon: "Tag", href: "/dashboard/assign-packages", roles: ["athletic", "admin"] },
      ]
    },
    {
      category: "Financeiro",
      items: [
        { label: "Pagamentos", icon: "CreditCard", href: "/dashboard/payments", roles: ["athlete", "athletic", "admin"] },
        { label: "Aprovar PIX", icon: "QrCode", href: "/dashboard/approve-pix", roles: ["admin"] },
        { label: "Configurar PIX", icon: "QrCode", href: "/dashboard/pix-settings", roles: ["athletic"] },
      ]
    },
    {
      category: "Configurações",
      items: [
        { label: "Configurações", icon: "Settings", href: "/dashboard/settings", roles: ["buyer", "athlete", "athletic", "admin"] },
      ]
    }
  ]

  const SidebarContent = () => (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
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
                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                        }`}
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
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={toggleTheme}
        >
          {theme === "light" ? <Icons.Moon className="mr-2 h-5 w-5" /> : <Icons.Sun className="mr-2 h-5 w-5" />}
          {theme === "light" ? "Modo Escuro" : "Modo Claro"}
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
          className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
        >
          {isMobileMenuOpen ? <Icons.X className="h-5 w-5" /> : <Icons.Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>
    </>
  )
}
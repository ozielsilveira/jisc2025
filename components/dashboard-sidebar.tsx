"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  CreditCard,
  Home,
  LogOut,
  Medal,
  Menu,
  Settings,
  Ticket,
  Trophy,
  User,
  Users,
  X,
  Package,
  Tag,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type UserRole = "buyer" | "athlete" | "athletic" | "admin"

export default function DashboardSidebar() {
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return

      const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (error) {
        console.error("Error fetching user role:", error)
        return
      }

      setUserRole(data.role as UserRole)
    }

    fetchUserRole()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isLinkActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    {
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
      roles: ["buyer", "athlete", "athletic", "admin"],
    },
    {
      label: "Meu Perfil",
      icon: <User className="h-5 w-5" />,
      href: "/dashboard/profile",
      roles: ["buyer", "athlete", "athletic", "admin"],
    },
    {
      label: "Ingressos",
      icon: <Ticket className="h-5 w-5" />,
      href: "/dashboard/tickets",
      roles: ["buyer", "athlete", "athletic", "admin"],
    },
    {
      label: "Atletas",
      icon: <Medal className="h-5 w-5" />,
      href: "/dashboard/athletes",
      roles: ["athletic", "admin"],
    },
    {
      label: "Atléticas",
      icon: <Trophy className="h-5 w-5" />,
      href: "/dashboard/athletics",
      roles: ["admin"],
    },
    {
      label: "Modalidades",
      icon: <Users className="h-5 w-5" />,
      href: "/dashboard/sports",
      roles: ["admin"],
    },
    {
      label: "Jogos",
      icon: <Calendar className="h-5 w-5" />,
      href: "/dashboard/games",
      roles: ["athlete", "athletic", "admin"],
    },
    {
      label: "Pacotes",
      icon: <Package className="h-5 w-5" />,
      href: "/dashboard/packages",
      roles: ["admin"],
    },
    {
      label: "Atribuir Pacotes",
      icon: <Tag className="h-5 w-5" />,
      href: "/dashboard/assign-packages",
      roles: ["athletic", "admin"],
    },
    {
      label: "Pagamentos",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/dashboard/payments",
      roles: ["athlete", "athletic", "admin"],
    },
    {
      label: "Configurações",
      icon: <Settings className="h-5 w-5" />,
      href: "/dashboard/settings",
      roles: ["buyer", "athlete", "athletic", "admin"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => userRole && item.roles.includes(userRole))

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar for mobile */}
      <div
        className={`fixed inset-0 z-40 transform bg-white transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto pt-16 pb-4">
          <div className="px-4 py-2 text-center">
            <div className="flex justify-center mb-2">
              <Image src="/logo.svg" alt="JISC Logo" width={50} height={50} />
            </div>
            <h2 className="text-2xl font-bold text-[#0456FC]">JISC</h2>
            <p className="text-sm text-gray-500">Campeonato Universitário</p>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-4">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-md px-4 py-3 text-sm font-medium ${
                  isLinkActive(item.href) ? "bg-[#0456FC] text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-4">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden w-64 flex-shrink-0 bg-white md:flex md:flex-col">
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="px-4 py-2 text-center">
            <div className="flex justify-center mb-2">
              <Image src="/logo.svg" alt="JISC Logo" width={50} height={50} />
            </div>
            <h2 className="text-2xl font-bold text-[#0456FC]">JISC</h2>
            <p className="text-sm text-gray-500">Campeonato Universitário</p>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-4">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-md px-4 py-3 text-sm font-medium ${
                  isLinkActive(item.href) ? "bg-[#0456FC] text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-4 pb-4">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}


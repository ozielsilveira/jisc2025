"use client"

import { useEffect, useState } from "react"

export function ScrollToSection() {
    const [activeSection, setActiveSection] = useState<string>("")

    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll("section[id]")

            let currentSection = ""

            sections.forEach((section) => {
                const sectionTop = section.getBoundingClientRect().top
                const sectionHeight = section.clientHeight

                // If the section is in view (top is less than 100px from the top of the viewport)
                if (sectionTop <= 100) {
                    currentSection = section.getAttribute("id") || ""
                }
            })

            setActiveSection(currentSection)
        }

        window.addEventListener("scroll", handleScroll)
        handleScroll() // Call once on mount to set initial active section

        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    return null // This component doesn't render anything visible
}


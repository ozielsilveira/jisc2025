"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface FeatureCardProps {
    title: string
    description: string
    icon: LucideIcon
    animation: string
}

export function FeatureCard({ title, description, icon: Icon, animation }: FeatureCardProps) {
    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    }

    // Icon animation variants
    const iconVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                duration: 0.5,
                delay: 0.2,
                ease: "easeOut"
            }
        },
        hover: {
            scale: 1.1,
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            }
        }
    }

    return (
        <motion.div
            className="bg-[#07F2F2] dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{ y: -5 }}
        >
            <div className="flex flex-col items-center text-center">
                <motion.div
                    className="w-16 h-16 rounded-full bg-[#C200F7]/10 flex items-center justify-center mb-4"
                    variants={iconVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    whileHover="hover"
                >
                    <Icon className="w-8 h-8 text-[#C200F7]" />
                </motion.div>

                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{description}</p>
            </div>
        </motion.div>
    )
}


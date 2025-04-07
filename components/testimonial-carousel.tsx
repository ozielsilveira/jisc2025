"use client"

import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { useEffect, useState } from "react"

const testimonials = [
    {
        id: 1,
        name: "Mariana Silva",
        role: "Atlética de Medicina",
        avatar: "M",
        content:
            "Participar do JISC foi uma experiência incrível! Além das competições, fiz amizades que vou levar para a vida toda.",
        rating: 5,
    },
    {
        id: 2,
        name: "Rafael Oliveira",
        role: "Atlética de Engenharia",
        avatar: "R",
        content:
            "O nível de organização do JISC é impressionante. A plataforma facilitou muito o acompanhamento dos jogos e a compra de ingressos.",
        rating: 5,
    },
    {
        id: 3,
        name: "Juliana Costa",
        role: "Atlética de Direito",
        avatar: "J",
        content:
            "As competições são acirradas, mas o espírito esportivo prevalece. A festa de encerramento é simplesmente inesquecível!",
        rating: 5,
    },
    {
        id: 4,
        name: "Pedro Santos",
        role: "Atlética de Administração",
        avatar: "P",
        content:
            "O JISC proporciona uma integração única entre os estudantes. É uma oportunidade incrível de networking e diversão.",
        rating: 4,
    },
    {
        id: 5,
        name: "Camila Ferreira",
        role: "Atlética de Psicologia",
        avatar: "C",
        content:
            "A organização do evento é impecável! Desde o processo de inscrição até a premiação, tudo é muito bem planejado e executado.",
        rating: 5,
    },
]

export function TestimonialCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    const nextTestimonial = () => {
        setDirection(1)
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }

    const prevTestimonial = () => {
        setDirection(-1)
        setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
    }

    useEffect(() => {
        if (!isPaused) {
            const interval = setInterval(() => {
                nextTestimonial()
            }, 5000)

            return () => clearInterval(interval)
        }
    }, [isPaused])

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
        }),
    }

    return (
        <div className="relative" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            <div className="overflow-hidden relative">
                <div className="flex justify-center">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="w-full max-w-4xl"
                        >
                            <div className="bg-[#07F2F2] dark:bg-gray-900 p-8 md:p-12 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-20 h-20 bg-gradient-to-br from-[#C200F7] to-[#9900c5] rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-white font-bold text-2xl">{testimonials[currentIndex].avatar}</span>
                                        </div>
                                    </div>

                                    <div className="flex-grow">
                                        <div className="flex items-center mb-2">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-5 h-5 ${i < testimonials[currentIndex].rating ? "text-purple-500 fill-current" : "text-purple-300"}`}
                                                />
                                            ))}
                                        </div>

                                        <p className="text-gray-700 dark:text-gray-300 text-lg italic mb-6">
                                            "{testimonials[currentIndex].content}"
                                        </p>

                                        <div>
                                            <h4 className="font-bold text-xl dark:text-white">{testimonials[currentIndex].name}</h4>
                                            <p className="text-[#C200F7]">{testimonials[currentIndex].role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex justify-center mt-8 gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={prevTestimonial}
                    className="rounded-full border-gray-200 dark:border-gray-700"
                    aria-label="Depoimento anterior"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setDirection(index > currentIndex ? 1 : -1)
                                setCurrentIndex(index)
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-[#C200F7] w-4" : "bg-gray-300 dark:bg-gray-700"
                                }`}
                            aria-label={`Ver depoimento ${index + 1}`}
                        />
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={nextTestimonial}
                    className="rounded-full border-gray-200 dark:border-gray-700"
                    aria-label="Próximo depoimento"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}


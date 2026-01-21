'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
    {
        id: 1,
        title: "Turn $5 into a Fortune",
        subtitle: "The Most Accessible Barrier in DeFi",
        description: "Start your journey to financial freedom with just 0.008 BNB. A coffee-sized investment that opens the door to unlimited earning potential on the Binance Smart Chain.",
        icon: "💎",
        color: "from-blue-600 to-purple-600",
        stats: "Entry Cost: $5"
    },
    {
        id: 2,
        title: "4 Powerful Income Streams",
        subtitle: "Diversified Earnings",
        description: "Don't rely on just one source. Earn simultaneously from Direct Referrals (95%), passive Sponsor Income, global Matrix placement, and the elite Royalty Pool.",
        icon: "🚀",
        color: "from-green-500 to-emerald-600",
        stats: "95% Direct Comm."
    },
    {
        id: 3,
        title: "The Power of Spillover",
        subtitle: "Global Team Growth",
        description: "Our 13-level auto-filling matrix places new members under you automatically. Benefit from the efforts of uplines and downlines alike. Teamwork makes the dream work.",
        icon: "🌐",
        color: "from-indigo-600 to-blue-600",
        stats: "13 Levels Deep"
    },
    {
        id: 4,
        title: "Elite Royalty Pool",
        subtitle: "Passive Global Revenue",
        description: "Reach Level 10 and unlock lifetime passive income. 5% of ALL system upgrades are distributed monthly to qualified leaders. True passive wealth.",
        icon: "👑",
        color: "from-yellow-500 to-orange-600",
        stats: "5% Global Pool"
    },
    {
        id: 5,
        title: "100% Decentralized Security",
        subtitle: "Trust in Code",
        description: "No CEO. No Admin wallet. No middleman. The smart contract distributes funds instantly and automatically to your wallet. Unstoppable and transparent.",
        icon: "🔒",
        color: "from-purple-600 to-pink-600",
        stats: "Verified Contract"
    }
];

export default function PresentationSection() {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 6000); // Auto-advance every 6 seconds
        return () => clearInterval(timer);
    }, [current]);

    const nextSlide = () => {
        setDirection(1);
        setCurrent((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8
        })
    };

    return (
        <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-12 drop-shadow-lg">
                Why <span className="text-yellow-300">FiveDollarBNB?</span>
            </h2>

            <div className="relative h-[600px] w-full max-w-5xl mx-auto perspective-1000">
                {/* Navigation Buttons */}
                <button
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-all border border-white/10"
                >
                    ❮
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-all border border-white/10"
                >
                    ❯
                </button>

                {/* Progress Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setDirection(idx > current ? 1 : -1);
                                setCurrent(idx);
                            }}
                            className={`h-3 rounded-full transition-all duration-300 ${idx === current ? 'w-12 bg-yellow-400' : 'w-3 bg-white/30 hover:bg-white/50'
                                }`}
                        />
                    ))}
                </div>

                <div className="relative w-full h-full overflow-hidden rounded-3xl border-4 border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={current}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className={`absolute inset-0 w-full h-full bg-gradient-to-br ${slides[current].color} p-8 md:p-16 flex flex-col justify-center items-center text-center`}
                        >
                            {/* Background Decoration */}
                            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                                <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white rounded-full blur-[100px]" />
                                <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-yellow-400 rounded-full blur-[100px]" />
                            </div>

                            {/* Content */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="relative z-10"
                            >
                                <div className="text-8xl md:text-9xl mb-6 drop-shadow-2xl animate-bounce-slow">
                                    {slides[current].icon}
                                </div>

                                <h3 className="text-yellow-300 text-xl md:text-2xl font-bold tracking-widest uppercase mb-4">
                                    {slides[current].subtitle}
                                </h3>

                                <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-8 leading-tight drop-shadow-xl">
                                    {slides[current].title}
                                </h2>

                                <p className="text-xl md:text-2xl text-blue-50 max-w-3xl mx-auto leading-relaxed mb-10">
                                    {slides[current].description}
                                </p>

                                <div className="inline-block bg-black/30 backdrop-blur-md border border-white/20 rounded-xl px-8 py-4">
                                    <span className="text-yellow-400 font-bold text-2xl">
                                        {slides[current].stats}
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const logos = [
    { name: "Princeton University", src: "/images/usedby/princeton.png" },
    { name: "Harvard University", src: "/images/usedby/harvard.png" },
    { name: "University of Washington", src: "/images/usedby/uw.png" },
    { name: "Technical University of Munich", src: "/images/usedby/tum.svg" },
    { name: "Stanford University", src: "/images/usedby/stanford.png" },
    { name: "University of Oxford", src: "/images/usedby/oxford.svg" },
] as const;

const ROTATION_INTERVAL_MS = 3000;
const SLOT_COUNT = 3;
const STAGGER_MS = 200;
const EXIT_Y_OFFSET = 48;

const logoMotion = {
    initial: { opacity: 0, y: EXIT_Y_OFFSET },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] },
    },
    exit: {
        opacity: 0,
        y: -EXIT_Y_OFFSET,
        transition: { duration: 0.6, ease: [0.4, 0, 0.6, 1] },
    },
} as const;

export const TrustedByCarousel = () => {
    const slotCount = Math.min(SLOT_COUNT, logos.length);

    const [visibleIndices, setVisibleIndices] = useState(() =>
        Array.from({ length: slotCount }, (_, idx) => idx % logos.length),
    );

    const scheduledTimeoutsRef = useRef<number[]>([]);
    const currentStartRef = useRef(0);

    useEffect(() => {
        const clearScheduled = () => {
            scheduledTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
            scheduledTimeoutsRef.current = [];
        };

        if (slotCount === 0 || logos.length <= slotCount) {
            return () => {
                clearScheduled();
            };
        }

        const intervalId = window.setInterval(() => {
            clearScheduled();

            const nextStart = (currentStartRef.current + slotCount) % logos.length;
            const targetIndices = Array.from({ length: slotCount }, (_, slot) =>
                (nextStart + slot) % logos.length,
            );

            targetIndices.forEach((targetIndex, slot) => {
                const timeoutId = window.setTimeout(() => {
                    setVisibleIndices((prev) => {
                        if (prev[slot] === targetIndex) {
                            return prev;
                        }

                        const updated = [...prev];
                        updated[slot] = targetIndex;
                        return updated;
                    });
                }, slot * STAGGER_MS);

                scheduledTimeoutsRef.current.push(timeoutId);
            });

            currentStartRef.current = nextStart;
        }, ROTATION_INTERVAL_MS);

        return () => {
            clearScheduled();
            window.clearInterval(intervalId);
        };
    }, [slotCount]);

    useEffect(() => {
        currentStartRef.current = 0;
        setVisibleIndices(
            Array.from({ length: slotCount }, (_, idx) => idx % logos.length),
        );
    }, [slotCount]);

    return (
        <section className="py-12 px-8">
            <div className="mx-auto max-w-7xl">
                <p className="text-gray-800 text-center text-sm uppercase tracking-wide font-bold mb-6">
                    Trusted by Researchers at
                </p>
                <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3">
                {visibleIndices.map((logoIndex, slotIndex) => {
                    const logo = logos[logoIndex];
                    const slotKey = `${slotIndex}`;

                    return (
                        <div
                            key={slotKey}
                            className="group relative flex h-20 w-full items-center justify-center overflow-hidden"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={logoIndex}
                                    initial={logoMotion.initial}
                                    animate={logoMotion.animate}
                                    exit={logoMotion.exit}
                                    className="flex items-center justify-center w-full h-full"
                                >
                                    <Image
                                        src={logo.src}
                                        alt={logo.name}
                                        width={176}
                                        height={72}
                                        className="h-14 w-auto max-w-[176px] object-contain opacity-60 grayscale transition duration-300 ease-out group-hover:opacity-100 group-hover:grayscale-0"
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    );
                })}
                </div>
            </div>
        </section>
    );
};

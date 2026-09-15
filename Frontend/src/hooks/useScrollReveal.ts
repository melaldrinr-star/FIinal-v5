import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface UseScrollRevealOptions {
  duration?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
  scrub?: number | boolean;
  markers?: boolean;
}

/**
 * useScrollReveal - GSAP scroll trigger reveal animation
 * Fades in elements as they enter viewport with optional scrub for parallax
 */
export const useScrollReveal = (
  options: UseScrollRevealOptions = {}
) => {
  const {
    duration = 0.8,
    delay = 0,
    stagger = 0.1,
    ease = 'power2.out',
    scrub = false,
    markers = false,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll('[data-scroll-reveal]');
    if (elements.length === 0) return;

    // Set initial state
    gsap.set(elements, {
      opacity: 0,
      y: 40,
    });

    // Create scroll trigger animation
    gsap.to(elements, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'top 20%',
        scrub: scrub,
        markers: markers,
        onEnter: () => {},
      },
      opacity: 1,
      y: 0,
      duration: duration,
      stagger: stagger,
      ease: ease,
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [duration, delay, stagger, ease, scrub, markers]);

  return containerRef;
};

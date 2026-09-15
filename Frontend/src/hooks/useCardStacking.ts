import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface UseCardStackingOptions {
  duration?: number;
  stagger?: number;
  ease?: string;
  perspective?: number;
  rotationX?: number;
  scaleStep?: number;
  markers?: boolean;
}

/**
 * useCardStacking - GSAP sequential card stack animation on scroll
 * Cards fade in and scale up with staggered timing as they enter viewport
 */
export const useCardStacking = (
  options: UseCardStackingOptions = {}
) => {
  const {
    duration = 0.6,
    stagger = 0.15,
    ease = 'back.out',
    perspective = 1200,
    rotationX = 0,
    scaleStep = 0.02,
    markers = false,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('[data-card-stack]');
    if (cards.length === 0) return;

    // Set perspective on container
    gsap.set(containerRef.current, {
      perspective: perspective,
    });

    // Set initial state for cards
    gsap.set(cards, {
      opacity: 0,
      scale: (i) => 0.85 + i * scaleStep,
      rotationX: rotationX,
      y: 30,
    });

    // Create scroll trigger animation
    gsap.to(cards, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
        end: 'top 25%',
        markers: markers,
      },
      opacity: 1,
      scale: 1,
      rotationX: 0,
      y: 0,
      duration: duration,
      stagger: stagger,
      ease: ease,
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [duration, stagger, ease, perspective, rotationX, scaleStep, markers]);

  return containerRef;
};

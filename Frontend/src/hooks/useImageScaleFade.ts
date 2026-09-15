import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface UseImageScaleFadeOptions {
  startScale?: number;
  endScale?: number;
  duration?: number;
  ease?: string;
  scrub?: number | boolean;
  markers?: boolean;
  parallaxIntensity?: number;
}

/**
 * useImageScaleFade - GSAP image scale and fade animation on scroll
 * Images scale from small to normal with opacity fade-in and optional parallax
 */
export const useImageScaleFade = (
  options: UseImageScaleFadeOptions = {}
) => {
  const {
    startScale = 0.9,
    endScale = 1,
    duration = 1.2,
    ease = 'power1.inOut',
    scrub = 0.1,
    markers = false,
    parallaxIntensity = 0,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const images = containerRef.current.querySelectorAll('[data-image-scale]');
    if (images.length === 0) return;

    // Set initial state
    gsap.set(images, {
      opacity: 0.5,
      scale: startScale,
    });

    // Create scroll trigger animation
    gsap.to(images, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'top 20%',
        scrub: scrub,
        markers: markers,
        onUpdate: (self) => {
          if (parallaxIntensity !== 0) {
            // Apply parallax effect
            gsap.set(images, {
              y: self.progress * parallaxIntensity * -100,
            });
          }
        },
      },
      opacity: 1,
      scale: endScale,
      duration: duration,
      ease: ease,
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [startScale, endScale, duration, ease, scrub, markers, parallaxIntensity]);

  return containerRef;
};

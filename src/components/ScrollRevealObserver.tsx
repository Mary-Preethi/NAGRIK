'use client';

import { useEffect } from 'react';

/**
 * ScrollRevealObserver Component (Interaction Experiment)
 * Lightweight IntersectionObserver for scroll-reveal animations.
 * Completely disabled when prefers-reduced-motion is active.
 * Failsafe timeout ensures no content is ever hidden.
 */
export default function ScrollRevealObserver() {
  useEffect(() => {
    // 1. Accessibility: Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        el.classList.add('reveal-visible');
      });
      return;
    }

    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) return;

    // 2. Fallback for older browsers without IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('reveal-visible'));
      return;
    }

    // 3. Initialize observer with soft offset
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));

    // 4. Safety timeout: automatically reveal all elements after 2s regardless
    const safetyTimer = setTimeout(() => {
      document.querySelectorAll('.reveal-on-scroll:not(.reveal-visible)').forEach((el) => {
        el.classList.add('reveal-visible');
      });
    }, 2000);

    return () => {
      clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, []);

  return null;
}

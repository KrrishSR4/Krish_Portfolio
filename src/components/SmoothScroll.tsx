import { useEffect, useRef } from "react";
import ScrollTrigger from "gsap/ScrollTrigger";

type LenisInstance = {
  raf: (time: number) => void;
  on: (event: "scroll", callback: () => void) => void;
  off: (event: "scroll", callback: () => void) => void;
  scrollTo: (
    target: string | number | HTMLElement,
    options?: {
      offset?: number;
      duration?: number;
    }
  ) => void;
  destroy: () => void;
};

type LenisConstructor = new (options: {
  duration: number;
  easing: (time: number) => number;
  smoothWheel: boolean;
  wheelMultiplier: number;
  touchMultiplier: number;
  syncTouch: boolean;
}) => LenisInstance;

type LenisScrollToEvent = CustomEvent<{
  target: string | number | HTMLElement;
  options?: {
    offset?: number;
    duration?: number;
  };
}>;

export default function SmoothScroll() {
  const lenisRef = useRef<LenisInstance | null>(null);

  useEffect(() => {
    const updateScrollTrigger = () => ScrollTrigger.update();
    let rafId = 0;
    let mounted = true;

    const handleScrollTo = (event: Event) => {
      const { target, options } = (event as LenisScrollToEvent).detail;
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, {
          offset: -132,
          duration: 1.05,
          ...options,
        });
        return;
      }

      const top =
        typeof target === "number"
          ? target
          : typeof target === "string"
            ? document.querySelector(target)?.getBoundingClientRect().top ?? 0
            : target.getBoundingClientRect().top;

      window.scrollTo({
        top: top + window.scrollY + (options?.offset ?? -132),
        behavior: "smooth",
      });
    };

    window.addEventListener("lenis-scroll-to", handleScrollTo);

    void import(/* @vite-ignore */ "lenis")
      .then((module: { default: LenisConstructor }) => {
        if (!mounted) return;

        const Lenis = module.default;
        const lenis = new Lenis({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.15,
          syncTouch: false,
        });

        lenisRef.current = lenis;
        lenis.on("scroll", updateScrollTrigger);

        const raf = (time: number) => {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
        ScrollTrigger.refresh();
      })
      .catch(() => {
        ScrollTrigger.refresh();
      });

    return () => {
      mounted = false;
      window.removeEventListener("lenis-scroll-to", handleScrollTo);
      cancelAnimationFrame(rafId);
      lenisRef.current?.off("scroll", updateScrollTrigger);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null;
}


import { useEffect, useState } from "react";
import { Button } from "./button";
import { ArrowUp } from "lucide-react";

export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.dispatchEvent(
      new CustomEvent("lenis-scroll-to", {
        detail: {
          target: 0,
          options: { offset: 0 },
        },
      })
    );
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isVisible && (
        <Button
          onClick={scrollToTop}
          size="icon"
          aria-label="Scroll to top"
          className="h-16 w-16 rounded-full bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] backdrop-blur-md border-2 border-[#1f7a1a] shadow-[0_0_150px_rgba(31,122,26,0.3),0_0_90px_rgba(31,122,26,0.25),0_0_38px_rgba(31,122,26,0.2)] transition-all duration-300 hover:-translate-y-1 hover:bg-gradient-to-r hover:from-[#dcfce7] hover:to-[#bbf7d0] hover:border-[#2da44e] hover:shadow-[0_0_220px_rgba(31,122,26,0.4),0_0_130px_rgba(31,122,26,0.35),0_0_48px_rgba(31,122,26,0.3)]"
        >
          <ArrowUp className="h-7 w-7 text-[#1f7a1a]" />
        </Button>
      )}
    </div>
  );
};

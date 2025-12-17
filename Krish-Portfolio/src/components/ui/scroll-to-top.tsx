
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
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
          className="h-16 w-16 rounded-full bg-white text-slate-900 shadow-[0_0_150px_rgba(15,23,42,0.82),0_0_90px_rgba(15,23,42,0.68),0_0_38px_rgba(30,41,59,0.75)] border border-white/80 transition-all duration-300 hover:-translate-y-1 hover:bg-[#d9d9d9] hover:text-slate-900 hover:shadow-[0_0_220px_rgba(15,23,42,0.92),0_0_130px_rgba(15,23,42,0.78),0_0_48px_rgba(30,41,59,0.85)]"
        >
          <ArrowUp className="h-7 w-7 text-slate-900" />
        </Button>
      )}
    </div>
  );
};

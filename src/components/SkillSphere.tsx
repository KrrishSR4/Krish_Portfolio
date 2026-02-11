import { useRef, useEffect, useCallback } from 'react';

const SIMPLE_ICONS_PRIMARY = "https://cdn.simpleicons.org";

const extractRgb = (rgba: string): string => {
    const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return "100, 116, 139";
    return `${match[1]}, ${match[2]}, ${match[3]}`;
};

interface SkillItem {
    name: string;
    slug: string;
    color: string;
}

interface ShadowPalette {
    base: string;
    hover: string;
}

interface SkillSphereProps {
    skills: SkillItem[];
    shadowPalette: Record<string, ShadowPalette>;
}

export default function SkillSphere({ skills, shadowPalette }: SkillSphereProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // High-performance 3D positions
    const px = useRef<Float32Array>(new Float32Array(0));
    const py = useRef<Float32Array>(new Float32Array(0));
    const pz = useRef<Float32Array>(new Float32Array(0));

    const isDragging = useRef(false);
    const vx = useRef(0.001);
    const vy = useRef(0.0005);
    const hovIdx = useRef(-1);
    const rgbStrings = useRef<string[]>([]);

    const init = useCallback(() => {
        const n = skills.length;
        px.current = new Float32Array(n);
        py.current = new Float32Array(n);
        pz.current = new Float32Array(n);
        rgbStrings.current = new Array(n);

        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
            const y = 1 - (i / (n - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = goldenAngle * i;
            px.current[i] = Math.cos(theta) * radius;
            py.current[i] = y;
            pz.current[i] = Math.sin(theta) * radius;

            const palette = shadowPalette[skills[i].slug];
            rgbStrings.current[i] = palette ? extractRgb(palette.hover) : "100, 116, 139";
        }
    }, [skills, shadowPalette]);

    const rotate = useCallback((ax: number, ay: number) => {
        const cx = Math.cos(ax), sx = Math.sin(ax);
        const cy = Math.cos(ay), sy = Math.sin(ay);
        const n = px.current.length;
        for (let i = 0; i < n; i++) {
            const y0 = py.current[i], z0 = pz.current[i];
            const y1 = y0 * cx - z0 * sx;
            const z1 = y0 * sx + z0 * cx;
            const x0 = px.current[i];
            const x1 = x0 * cy + z1 * sy;
            const z2 = -x0 * sy + z1 * cy;
            px.current[i] = x1;
            py.current[i] = y1;
            pz.current[i] = z2;
        }
    }, []);

    useEffect(() => {
        init();
        const container = containerRef.current;
        const tooltip = tooltipRef.current;
        if (!container || !tooltip) return;

        const nodes = container.querySelectorAll<HTMLDivElement>('.sn');
        const cards = container.querySelectorAll<HTMLDivElement>('.sc');
        const labels = container.querySelectorAll<HTMLSpanElement>('.sl');
        const n = nodes.length;

        let rafId = 0;

        const render = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            const centerX = w / 2;
            const centerY = h / 2;
            // Slightly larger radius for less crowding
            const sphereRadius = Math.min(centerX, centerY) * 0.8;

            for (let i = 0; i < n; i++) {
                const depth = (pz.current[i] + 1) / 2; // 0 to 1
                const scale = 0.6 + depth * 0.6;
                const opacity = 0.2 + depth * 0.8;
                const x = centerX + px.current[i] * sphereRadius;
                const y = centerY + py.current[i] * sphereRadius;

                const el = nodes[i];
                // Using transform3d for hardware acceleration
                el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%, -50%) scale(${scale})`;
                el.style.opacity = `${opacity}`;
                el.style.zIndex = `${Math.round(depth * 100)}`;
            }
        };

        const loop = () => {
            if (!isDragging.current) {
                rotate(vy.current, vx.current);
                // Friction: decay velocity
                vx.current *= 0.96;
                vy.current *= 0.96;
                // Minimum idle spin
                if (Math.abs(vx.current) < 0.0005) vx.current = 0.0005;
                if (Math.abs(vy.current) < 0.0003) vy.current = 0.0003;
            }
            render();
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);

        // Optimized Hover Logic
        const setNodeHover = (idx: number, isHover: boolean) => {
            if (idx < 0 || idx >= n) return;
            const card = cards[idx];
            const label = labels[idx];
            const rgb = rgbStrings.current[idx];
            if (isHover) {
                card.style.background = `rgba(${rgb}, 0.1)`;
                card.style.borderColor = `rgba(${rgb}, 0.6)`;
                card.style.boxShadow = `0 10px 30px rgba(${rgb}, 0.3)`;
                card.style.transform = 'scale(1.15)';
                label.style.color = `rgb(${rgb})`;
            } else {
                card.style.background = 'rgba(255, 255, 255, 0.8)';
                card.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                card.style.boxShadow = 'none';
                card.style.transform = 'scale(1)';
                label.style.color = '#1e293b';
            }
        };

        const updateTooltip = (idx: number, x: number, y: number) => {
            if (idx < 0) {
                tooltip.style.opacity = '0';
                return;
            }
            const rgb = rgbStrings.current[idx];
            const rect = container.getBoundingClientRect();
            tooltip.style.left = `${x - rect.left}px`;
            tooltip.style.top = `${y - rect.top - 50}px`;
            tooltip.style.opacity = '1';
            const box = tooltip.querySelector('.tb') as HTMLDivElement;
            const arrow = tooltip.querySelector('.ta') as HTMLDivElement;
            if (box) {
                box.textContent = skills[idx].name;
                box.style.background = `rgb(${rgb})`;
            }
            if (arrow) arrow.style.borderTopColor = `rgb(${rgb})`;
        };

        const hitTest = (mx: number, my: number): number => {
            let bIdx = -1, bZ = -Infinity;
            for (let i = 0; i < n; i++) {
                const r = nodes[i].getBoundingClientRect();
                if (mx > r.left && mx < r.right && my > r.top && my < r.bottom) {
                    if (pz.current[i] > bZ) {
                        bZ = pz.current[i];
                        bIdx = i;
                    }
                }
            }
            return bIdx;
        };

        // Events
        const onDown = (e: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
            isDragging.current = true;
            if (hovIdx.current >= 0) setNodeHover(hovIdx.current, false);
            hovIdx.current = -1;
            updateTooltip(-1, 0, 0);
            // Disable transitions during drag for absolute smoothness
            cards.forEach(c => c.style.transition = 'none');
        };

        const onMove = (e: PointerEvent) => {
            if (isDragging.current) {
                const dx = e.movementX || 0;
                const dy = e.movementY || 0;
                rotate(dy * -0.004, dx * 0.004);
                // Exponential moving average for smooth momentum
                vx.current = vx.current * 0.2 + (dx * 0.002) * 0.8;
                vy.current = vy.current * 0.2 + (dy * -0.002) * 0.8;
                return;
            }
            // Hover detection
            const idx = hitTest(e.clientX, e.clientY);
            if (idx !== hovIdx.current) {
                if (hovIdx.current >= 0) setNodeHover(hovIdx.current, false);
                hovIdx.current = idx;
                if (idx >= 0) setNodeHover(idx, true);
            }
            updateTooltip(idx, e.clientX, e.clientY);
        };

        const onUp = () => {
            isDragging.current = false;
            // Re-enable transitions
            cards.forEach(c => c.style.transition = 'background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s');
        };

        window.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerup', onUp);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, [init, rotate, skills]);

    return (
        <div className="w-full relative py-12 select-none overflow-hidden">
            <div className="text-center mb-8 pointer-events-none">
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-pink-600 bg-clip-text text-transparent uppercase tracking-tight">
                    Interactive Skill Cloud
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 opacity-60">
                    Drag to explore • Powered by Pure DOM
                </p>
            </div>

            <div
                ref={containerRef}
                className="relative w-full h-[400px] md:h-[550px] mx-auto overflow-visible cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
            >
                {skills.map((skill) => (
                    <div key={skill.slug} className="sn absolute top-0 left-0 will-change-transform pointer-events-none origin-center">
                        <div
                            className="sc flex items-center gap-3 px-4 py-2.5 rounded-xl border border-black/5 bg-white/80 shadow-sm transition-all duration-200 ease-out"
                        >
                            <img
                                src={`${SIMPLE_ICONS_PRIMARY}/${skill.slug}`}
                                alt={skill.name}
                                className="w-7 h-7 md:w-9 md:h-9 object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                                loading="lazy"
                                draggable={false}
                            />
                            <span className="sl text-xs font-bold text-slate-800 whitespace-nowrap">
                                {skill.name}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Floating Tooltip */}
                <div
                    ref={tooltipRef}
                    className="absolute pointer-events-none z-[1000] transition-opacity duration-150 ease-out"
                    style={{ transform: 'translateX(-50%)', opacity: 0 }}
                >
                    <div className="tb px-3 py-1.5 rounded-lg text-white text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-xl" />
                    <div className="ta mx-auto w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white" />
                </div>
            </div>

            <div className="flex justify-center mt-6 pointer-events-none">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/50 border border-slate-200/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {skills.length} Tech Stack
                    </span>
                </div>
            </div>
        </div>
    );
}

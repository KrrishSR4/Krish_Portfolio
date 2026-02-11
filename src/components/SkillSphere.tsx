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

    // Store 3D positions as plain arrays (mutable, no React state)
    const px = useRef<Float64Array>(new Float64Array(0));
    const py = useRef<Float64Array>(new Float64Array(0));
    const pz = useRef<Float64Array>(new Float64Array(0));

    const isDragging = useRef(false);
    const lastX = useRef(0);
    const lastY = useRef(0);
    const vx = useRef(0.004);
    const vy = useRef(0.002);
    const hovIdx = useRef(-1);

    // Pre-compute rgb strings per skill
    const rgbStrings = useRef<string[]>([]);

    const init = useCallback(() => {
        const n = skills.length;
        px.current = new Float64Array(n);
        py.current = new Float64Array(n);
        pz.current = new Float64Array(n);
        rgbStrings.current = new Array(n);

        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
            const y = 1 - (i / (n - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            const t = golden * i;
            px.current[i] = Math.cos(t) * r;
            py.current[i] = y;
            pz.current[i] = Math.sin(t) * r;

            const pal = shadowPalette[skills[i].slug];
            rgbStrings.current[i] = pal ? extractRgb(pal.hover) : "100, 116, 139";
        }
    }, [skills, shadowPalette]);

    // Rotate in-place (no allocation)
    const rotate = useCallback((ax: number, ay: number) => {
        const cx = Math.cos(ax), sx = Math.sin(ax);
        const cy = Math.cos(ay), sy = Math.sin(ay);
        const n = px.current.length;
        for (let i = 0; i < n; i++) {
            const y1 = py.current[i] * cx - pz.current[i] * sx;
            const z1 = py.current[i] * sx + pz.current[i] * cx;
            const x1 = px.current[i] * cy + z1 * sy;
            const z2 = -px.current[i] * sy + z1 * cy;
            px.current[i] = x1;
            py.current[i] = y1;
            pz.current[i] = z2;
        }
    }, []);

    // Render loop + event handlers — all pure DOM, zero setState
    useEffect(() => {
        init();
        const container = containerRef.current;
        const tooltip = tooltipRef.current;
        if (!container || !tooltip) return;

        const nodes = container.querySelectorAll<HTMLDivElement>('.sn');
        const cards = container.querySelectorAll<HTMLDivElement>('.sc');
        const labels = container.querySelectorAll<HTMLSpanElement>('.sl');
        const n = nodes.length;

        // Hide tooltip initially
        tooltip.style.opacity = '0';
        tooltip.style.pointerEvents = 'none';

        let raf = 0;

        const render = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            const cx = w / 2;
            const cy = h / 2;
            const rad = Math.min(cx, cy) * 0.72;

            for (let i = 0; i < n; i++) {
                const ds = (pz.current[i] + 1.5) / 2.5;
                const op = Math.max(0.15, (pz.current[i] + 1) / 2);
                const x = cx + px.current[i] * rad;
                const y = cy + py.current[i] * rad;
                const s = 0.5 + ds * 0.55;
                const el = nodes[i];
                el.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,0) scale(${s})`;
                el.style.opacity = `${op}`;
                el.style.zIndex = `${(ds * 100) | 0}`;
            }
        };

        const tick = () => {
            if (!isDragging.current) {
                rotate(vy.current * 0.4, vx.current * 0.4);
            }
            render();
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        // --- Hover: direct DOM style manipulation ---
        const applyHover = (i: number) => {
            if (hovIdx.current === i) return;
            // Clear old
            if (hovIdx.current >= 0) clearHover(hovIdx.current);
            hovIdx.current = i;
            if (i < 0) return;
            const rgb = rgbStrings.current[i];
            const card = cards[i];
            const label = labels[i];
            card.style.background = `rgba(${rgb},0.15)`;
            card.style.borderColor = `rgba(${rgb},0.5)`;
            card.style.boxShadow = `0 12px 40px rgba(${rgb},0.4), 0 0 0 1px rgba(${rgb},0.2)`;
            card.style.transform = 'scale(1.15)';
            label.style.color = `rgb(${rgb})`;
        };

        const clearHover = (i: number) => {
            if (i < 0 || i >= n) return;
            const card = cards[i];
            const label = labels[i];
            card.style.background = 'rgba(255,255,255,0.7)';
            card.style.borderColor = 'rgba(255,255,255,0.4)';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            card.style.transform = 'scale(1)';
            label.style.color = '#334155';
        };

        const showTooltip = (i: number, mx: number, my: number) => {
            const rgb = rgbStrings.current[i];
            const rect = container.getBoundingClientRect();
            tooltip.style.left = `${mx - rect.left}px`;
            tooltip.style.top = `${my - rect.top - 52}px`;
            tooltip.style.opacity = '1';
            const inner = tooltip.firstElementChild as HTMLDivElement;
            if (inner) {
                inner.textContent = skills[i].name;
                inner.style.background = `linear-gradient(135deg, rgb(${rgb}), rgba(${rgb},0.8))`;
                inner.style.boxShadow = `0 8px 24px rgba(${rgb},0.4)`;
            }
            const arrow = tooltip.querySelector('.ta') as HTMLDivElement;
            if (arrow) {
                arrow.style.background = `rgb(${rgb})`;
            }
        };

        const hideTooltip = () => {
            tooltip.style.opacity = '0';
        };

        // Hit test: which node is the cursor over?
        const hitTest = (mx: number, my: number): number => {
            let best = -1;
            let bestZ = -Infinity;
            for (let i = 0; i < n; i++) {
                const rect = nodes[i].getBoundingClientRect();
                if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
                    if (pz.current[i] > bestZ) {
                        bestZ = pz.current[i];
                        best = i;
                    }
                }
            }
            return best;
        };

        const inBounds = (x: number, y: number) => {
            const r = container.getBoundingClientRect();
            return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        };

        // --- Pointer handlers on window ---
        const onDown = (e: PointerEvent) => {
            if (!inBounds(e.clientX, e.clientY)) return;
            isDragging.current = true;
            lastX.current = e.clientX;
            lastY.current = e.clientY;
            applyHover(-1);
            hideTooltip();
        };

        const onMove = (e: PointerEvent) => {
            if (isDragging.current) {
                const dx = e.clientX - lastX.current;
                const dy = e.clientY - lastY.current;
                lastX.current = e.clientX;
                lastY.current = e.clientY;
                rotate(dy * 0.008, dx * 0.008);
                vx.current = dx * 0.002 + vx.current * 0.7;
                vy.current = dy * 0.002 + vy.current * 0.7;
                return;
            }
            if (!inBounds(e.clientX, e.clientY)) {
                applyHover(-1);
                hideTooltip();
                return;
            }
            const idx = hitTest(e.clientX, e.clientY);
            applyHover(idx);
            if (idx >= 0) {
                showTooltip(idx, e.clientX, e.clientY);
            } else {
                hideTooltip();
            }
        };

        const onUp = () => {
            isDragging.current = false;
        };

        window.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, [init, rotate, skills]);

    return (
        <div className="w-full relative mt-12">
            <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-pink-600 bg-clip-text text-transparent uppercase tracking-tight">
                    Skill Sphere
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
                    Drag to rotate • Interactive 3D Cloud
                </p>
            </div>

            <div
                ref={containerRef}
                className="relative w-full h-[380px] md:h-[520px] cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-3xl"
                style={{ touchAction: 'none' }}
            >
                {skills.map((skill) => (
                    <div key={skill.slug} className="sn absolute top-0 left-0 will-change-transform pointer-events-none">
                        <div
                            className="sc flex items-center gap-3 px-4 py-3 rounded-2xl border-2 backdrop-blur-md"
                            style={{
                                background: 'rgba(255,255,255,0.7)',
                                borderColor: 'rgba(255,255,255,0.4)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                            }}
                        >
                            <img
                                src={`${SIMPLE_ICONS_PRIMARY}/${skill.slug}`}
                                alt={skill.name}
                                className="w-8 h-8 md:w-10 md:h-10 object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                loading="lazy"
                                draggable={false}
                            />
                            <span
                                className="sl text-xs md:text-sm font-extrabold whitespace-nowrap"
                                style={{ color: '#334155', transition: 'color 0.2s' }}
                            >
                                {skill.name}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Tooltip — manipulated directly via ref, never re-rendered */}
                <div
                    ref={tooltipRef}
                    className="absolute pointer-events-none z-[200]"
                    style={{ opacity: 0, transform: 'translateX(-50%)', transition: 'opacity 0.1s' }}
                >
                    <div
                        className="px-4 py-2 rounded-xl text-white text-xs font-extrabold uppercase tracking-wider shadow-2xl whitespace-nowrap relative"
                    >
                        &nbsp;
                        <div className="ta absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45" />
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-5">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {skills.length} Technologies
                    </span>
                </div>
            </div>
        </div>
    );
}

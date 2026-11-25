import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  stickyTop?: boolean;
  stickyOffsetClass?: string;
}

export const HorizontalScrollArea: React.FC<HorizontalScrollAreaProps> = ({
  children,
  className = '',
  stickyTop = true,
  stickyOffsetClass = 'top-[58px]',
}) => {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef<'top' | 'content' | null>(null);

  const [metrics, setMetrics] = useState({
    hasOverflow: false,
    scrollWidth: 0,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const updateMetrics = useCallback(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    const scrollWidth = el.scrollWidth;
    const clientWidth = el.clientWidth;
    const scrollLeft = el.scrollLeft;
    const hasOverflow = scrollWidth - clientWidth > 2;
    setMetrics({
      hasOverflow,
      scrollWidth,
      canScrollLeft: hasOverflow && scrollLeft > 2,
      canScrollRight: hasOverflow && scrollLeft + clientWidth < scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return;

    updateMetrics();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateMetrics())
      : null;
    resizeObserver?.observe(el);
    if (el.firstElementChild) {
      resizeObserver?.observe(el.firstElementChild);
    }

    const mutationObserver = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => updateMetrics())
      : null;
    mutationObserver?.observe(el, { childList: true, subtree: true, attributes: true });

    window.addEventListener('resize', updateMetrics);
    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener('resize', updateMetrics);
    };
  }, [updateMetrics]);

  const handleTopScroll = () => {
    if (syncingRef.current === 'content') return;
    const topEl = topScrollRef.current;
    const contentEl = contentScrollRef.current;
    if (!topEl || !contentEl) return;
    syncingRef.current = 'top';
    contentEl.scrollLeft = topEl.scrollLeft;
    updateMetrics();
    requestAnimationFrame(() => {
      if (syncingRef.current === 'top') syncingRef.current = null;
    });
  };

  const handleContentScroll = () => {
    if (syncingRef.current === 'top') return;
    const topEl = topScrollRef.current;
    const contentEl = contentScrollRef.current;
    if (!contentEl) return;
    syncingRef.current = 'content';
    if (topEl) {
      topEl.scrollLeft = contentEl.scrollLeft;
    }
    updateMetrics();
    requestAnimationFrame(() => {
      if (syncingRef.current === 'content') syncingRef.current = null;
    });
  };

  const scrollByStep = (direction: -1 | 1) => {
    const contentEl = contentScrollRef.current;
    if (!contentEl) return;
    const step = Math.max(Math.round(contentEl.clientWidth * 0.45), 220);
    contentEl.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {metrics.hasOverflow && (
        <div
          className={`print:hidden flex items-center gap-1.5 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 px-2 py-1.5 ${
            stickyTop ? `sticky ${stickyOffsetClass} z-20` : ''
          }`}
        >
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            disabled={!metrics.canScrollLeft}
            aria-label="Cuộn sang trái"
            title="Cuộn sang trái"
            className="shrink-0 p-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-red-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="flex-1 overflow-x-auto overflow-y-hidden table-scrollbar-top"
            aria-label="Thanh cuộn ngang bảng"
          >
            <div style={{ width: `${metrics.scrollWidth}px`, height: '1px' }} />
          </div>

          <button
            type="button"
            onClick={() => scrollByStep(1)}
            disabled={!metrics.canScrollRight}
            aria-label="Cuộn sang phải"
            title="Cuộn sang phải"
            className="shrink-0 p-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-red-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <span className="hidden sm:inline-block shrink-0 text-[10px] font-bold text-slate-500 pl-1">
            Kéo ngang xem thêm cột
          </span>
        </div>
      )}

      <div
        ref={contentScrollRef}
        onScroll={handleContentScroll}
        className={`overflow-x-auto table-scrollbar ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

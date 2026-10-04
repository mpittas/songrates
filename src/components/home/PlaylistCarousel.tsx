"use client";

import { useRef, useState, useEffect, MouseEvent, TouchEvent } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

interface Props {
  children: React.ReactNode;
}

export default function PlaylistCarousel({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragAmount, setDragAmount] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [children]);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => window.removeEventListener("mouseup", handleWindowMouseUp);
  }, []);

  const handleMouseDown = (e: MouseEvent) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    setDragAmount(0);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast
    setDragAmount((prev) => prev + Math.abs(x - startX));
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragAmount(0);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    setDragAmount((prev) => prev + Math.abs(x - startX));
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleClickCapture = (e: MouseEvent) => {
    if (dragAmount > 10) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const scrollBy = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group/carousel w-full">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy("left")}
          className="absolute top-[38%] -left-4 z-30 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface text-ink opacity-0 shadow-pop transition-[opacity,transform] duration-200 group-hover/carousel:opacity-100 hover:scale-105 focus-visible:opacity-100 md:flex"
          aria-label="Scroll left"
        >
          <LuChevronLeft size={20} />
        </button>
      )}

      {/* Scroll Area */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onClickCapture={handleClickCapture}
        onScroll={checkScroll}
        draggable={false}
        className={`scrollbar-none -mx-4 flex w-auto touch-pan-x scroll-px-4 gap-3 overflow-x-auto overflow-y-hidden px-4 pb-2 select-none sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6 md:mx-0 md:scroll-px-0 md:gap-5 md:px-0 ${
          isDragging
            ? "cursor-grabbing snap-none"
            : "snap-x snap-mandatory scroll-smooth md:cursor-grab"
        }`}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy("right")}
          className="absolute top-[38%] -right-4 z-30 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface text-ink opacity-0 shadow-pop transition-[opacity,transform] duration-200 group-hover/carousel:opacity-100 hover:scale-105 focus-visible:opacity-100 md:flex"
          aria-label="Scroll right"
        >
          <LuChevronRight size={20} />
        </button>
      )}
    </div>
  );
}

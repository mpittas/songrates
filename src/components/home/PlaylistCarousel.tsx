"use client";

import { useRef, useState, useEffect, MouseEvent, TouchEvent } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

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
          onClick={() => scrollBy("left")}
          className="absolute left-2 top-[40%] md:top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black border border-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <FaChevronLeft className="w-5 h-5 pr-1" />
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
        className={`flex overflow-x-auto overflow-y-hidden gap-4 w-full pb-6 px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none touch-pan-x [user-select:none] ${
          isDragging
            ? "cursor-grabbing snap-none"
            : "cursor-grab snap-x snap-mandatory scroll-smooth"
        }`}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy("right")}
          className="absolute right-2 top-[40%] md:top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black border border-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <FaChevronRight className="w-5 h-5 pl-1" />
        </button>
      )}
    </div>
  );
}

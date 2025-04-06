import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselCardsProps {
  cards: React.ReactNode[];
  title?: string;
  description?: string;
  cardWidth?: number;
  cardGap?: number;
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export default function CarouselCards({
  cards,
  title,
  description,
  cardWidth = 300,
  cardGap = 16,
  autoPlay = false,
  interval = 5000,
  className = '',
}: CarouselCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const totalCards = cards.length;
  const maxIndex = Math.max(0, totalCards - getVisibleCardsCount());
  
  // Determine how many cards can be shown at once based on container width
  function getVisibleCardsCount() {
    if (!carouselRef.current) return 1;
    const containerWidth = carouselRef.current.clientWidth;
    return Math.max(1, Math.floor(containerWidth / (cardWidth + cardGap)));
  }
  
  const visibleCards = getVisibleCardsCount();
  
  // Handle auto-play functionality
  useEffect(() => {
    if (!autoPlay || totalCards <= visibleCards) return;
    
    const timer = setInterval(() => {
      if (activeIndex < maxIndex) {
        handleNext();
      } else {
        setActiveIndex(0);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [autoPlay, activeIndex, maxIndex, interval, visibleCards]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Adjust the active index if needed after resize
      const newMaxIndex = Math.max(0, totalCards - getVisibleCardsCount());
      if (activeIndex > newMaxIndex) {
        setActiveIndex(newMaxIndex);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex, totalCards]);
  
  // Handle navigation
  const handlePrev = () => {
    if (isTransitioning || activeIndex <= 0) return;
    setIsTransitioning(true);
    setActiveIndex(prev => Math.max(0, prev - 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };
  
  const handleNext = () => {
    if (isTransitioning || activeIndex >= maxIndex) return;
    setIsTransitioning(true);
    setActiveIndex(prev => Math.min(maxIndex, prev + 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };
  
  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex(Math.min(maxIndex, Math.max(0, index)));
    setTimeout(() => setIsTransitioning(false), 300);
  };
  
  const translateValue = -activeIndex * (cardWidth + cardGap);
  
  return (
    <div className={`w-full ${className}`}>
      {/* Carousel header */}
      {(title || description) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-[#243E4D]">{title}</h3>}
            {description && <p className="text-sm text-neutral-500">{description}</p>}
          </div>
          
          {/* Navigation dots for mobile */}
          {totalCards > visibleCards && (
            <div className="flex mt-2 md:mt-0">
              <div className="flex space-x-1">
                {Array.from({ length: maxIndex + 1 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      i === activeIndex 
                        ? 'bg-[#29B7D3] w-4' 
                        : 'bg-neutral-300 hover:bg-neutral-400'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              
              {/* Navigation arrows */}
              <div className="flex ml-4 space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-full ${
                    activeIndex === 0 ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-700'
                  }`}
                  onClick={handlePrev}
                  disabled={activeIndex === 0}
                  style={{ 
                    transformStyle: 'preserve-3d', 
                    transform: 'translateZ(1px)' 
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-full ${
                    activeIndex === maxIndex ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-700'
                  }`}
                  onClick={handleNext}
                  disabled={activeIndex === maxIndex}
                  style={{ 
                    transformStyle: 'preserve-3d', 
                    transform: 'translateZ(1px)' 
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Carousel container */}
      <div 
        className="relative overflow-hidden"
        ref={carouselRef}
        style={{ 
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
      >
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ 
            transform: `translateX(${translateValue}px)` 
          }}
        >
          {cards.map((card, index) => (
            <div 
              key={index}
              className={`flex-shrink-0 ${index < totalCards - 1 ? 'mr-4' : ''}`}
              style={{ 
                width: `${cardWidth}px`,
                transformStyle: 'preserve-3d',
                transform: `translateZ(${index === activeIndex ? 2 : 0}px) scale(${index === activeIndex ? 1 : 0.98})`,
                transition: 'all 0.3s ease-in-out'
              }}
            >
              <Card 
                className={`h-full border border-neutral-200 transition-shadow hover:shadow-md ${
                  index === activeIndex ? 'shadow-md' : 'shadow-sm'
                }`}
                style={{ 
                  transformStyle: 'preserve-3d'
                }}
              >
                <CardContent className="p-0">
                  {card}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Left scroll button (only shown on desktop) */}
        {activeIndex > 0 && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg hidden md:flex items-center justify-center bg-white/90 text-neutral-700 border border-neutral-200"
            onClick={handlePrev}
            style={{ 
              transformStyle: 'preserve-3d', 
              transform: 'translateZ(5px)' 
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        
        {/* Right scroll button (only shown on desktop) */}
        {activeIndex < maxIndex && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg hidden md:flex items-center justify-center bg-white/90 text-neutral-700 border border-neutral-200"
            onClick={handleNext}
            style={{ 
              transformStyle: 'preserve-3d', 
              transform: 'translateZ(5px)' 
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
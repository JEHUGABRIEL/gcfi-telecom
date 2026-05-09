import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

export default function OptimizedImage({ src, alt, className, imgClassName }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <Maximize2 className="h-6 w-6 text-gray-300" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-700 ${imgClassName} ${
          isLoaded 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-110'
        }`}
      />
    </div>
  );
}

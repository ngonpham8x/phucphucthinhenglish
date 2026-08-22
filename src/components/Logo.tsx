import React from 'react';
import logoImg from '../assets/images/regenerated_image_1786351687546.png';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 48, showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logoImg}
        onError={(e) => {
          // Fallback to static public path if needed
          e.currentTarget.src = '/logo.png';
        }}
        alt="Phúc Phúc Thịnh English Logo"
        style={{ width: `${size}px`, height: `${size}px` }}
        referrerPolicy="no-referrer"
        className="flex-shrink-0 rounded-full object-cover shadow-xs border border-slate-200/80 bg-white"
      />

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-red-900 tracking-tight text-base sm:text-lg leading-tight uppercase">
            PHÚC PHÚC THỊNH
          </span>
          <span className="text-xs font-semibold text-blue-900 tracking-wide">
            ENGLISH CENTER
          </span>
        </div>
      )}
    </div>
  );
};


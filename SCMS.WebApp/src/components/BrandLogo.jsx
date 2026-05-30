import React from "react";

export function BrandLogoIcon({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Rich gradient to match the premium blue curved clinical cross design */}
        <linearGradient id="logoBlueGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="logoLightGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      
      {/* Vertical Curved Body */}
      <path
        d="M50 8C58 20 62 38 62 50C62 62 58 80 50 92C42 80 38 62 38 50C38 38 42 20 50 8Z"
        fill="url(#logoBlueGrad)"
      />
      
      {/* Horizontal Curved Body with Blend Mode and opacity for dynamic overlay */}
      <path
        d="M8 50C20 58 38 62 50 62C62 62 80 58 92 50C80 42 62 38 50 38C38 38 20 42 8 50Z"
        fill="url(#logoLightGrad)"
        opacity="0.95"
      />
      
      {/* Inner sheen curve representing the dynamic overlapping ribbon structure */}
      <path
        d="M50 38C55 42 60 47 60 50C60 53 55 58 50 62C48 57 47 53 47 50C47 47 48 43 50 38Z"
        fill="#FFFFFF"
        opacity="0.3"
      />
      
      {/* Sleek center core highlight */}
      <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
    </svg>
  );
}

export function BrandLogoFull({ size = 48, className = "", textColor = "text-scms-text" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <BrandLogoIcon size={size} />
      <span className={`text-lg font-black tracking-tight ${textColor}`}>ကုမယ်</span>
    </div>
  );
}

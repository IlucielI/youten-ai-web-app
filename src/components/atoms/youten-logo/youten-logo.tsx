import React from 'react';
import { cn } from '@/lib/utils';

export interface YoutenLogoProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | number;
  showText?: boolean;
  textClassName?: string;
}

const SIZE_MAP = {
  sm: 22,
  md: 28,
  lg: 36,
};

export const YoutenLogo: React.FC<YoutenLogoProps> = ({
  size = 'md',
  showText = false,
  className,
  textClassName,
  ...props
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 28;

  const svgElement = (
    <svg
      width={pixelSize}
      height={(pixelSize * 28) / 29}
      viewBox="0 0 29 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="youten-logo-mark"
      className={cn('shrink-0 select-none transition-transform duration-200', className)}
      {...props}
    >
      {/* Equalizer Bar 1 */}
      <rect
        x="0"
        y="4"
        width="3"
        height="14"
        rx="1.5"
        className="fill-foreground transition-colors"
      />
      {/* Equalizer Bar 2 */}
      <rect
        x="6"
        y="8"
        width="3"
        height="16"
        rx="1.5"
        className="fill-foreground transition-colors"
      />
      {/* Crown Focal Core (要点 - Electric Blue Dot) */}
      <circle
        cx="14.5"
        cy="3"
        r="3"
        fill="#0070F3"
        className="drop-shadow-[0_0_6px_rgba(0,112,243,0.5)]"
      />
      {/* Center Equalizer Stem */}
      <rect
        x="13"
        y="8"
        width="3"
        height="20"
        rx="1.5"
        className="fill-foreground transition-colors"
      />
      {/* Equalizer Bar 4 */}
      <rect
        x="20"
        y="8"
        width="3"
        height="16"
        rx="1.5"
        className="fill-foreground transition-colors"
      />
      {/* Equalizer Bar 5 */}
      <rect
        x="26"
        y="4"
        width="3"
        height="14"
        rx="1.5"
        className="fill-foreground transition-colors"
      />
    </svg>
  );

  if (!showText) {
    return svgElement;
  }

  return (
    <div className="inline-flex items-center gap-2.5 group">
      {svgElement}
      <span
        data-testid="youten-logo-text"
        className={cn(
          'font-extrabold tracking-tight text-foreground text-base select-none',
          textClassName
        )}
      >
        Youten AI
      </span>
    </div>
  );
};

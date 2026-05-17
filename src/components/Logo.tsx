import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  variant?: "default" | "monochrome" | "icon";
}

export function Logo({ className, variant = "default", ...props }: LogoProps) {
  const isIcon = variant === "icon";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={isIcon ? "24" : "32"}
        height={isIcon ? "24" : "32"}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        {...props}
      >
        <path
          d="M16 4L28 10V22L16 28L4 22V10L16 4Z"
          className={cn(
            "stroke-[2.5] stroke-linejoin-round",
            variant === "monochrome" ? "stroke-current" : "stroke-slate-300 "
          )}
        />
        <path
          d="M16 12L22 15V21L16 24L10 21V15L16 12Z"
          className={cn(
            "fill-current",
            variant === "monochrome" ? "text-current" : "text-accent"
          )}
        />
        <path
          d="M16 4V12M28 10L22 15M4 10L10 15M4 22L10 21M28 22L22 21M16 28V24"
          className={cn(
            "stroke-[2] stroke-linecap-round",
            variant === "monochrome" ? "stroke-current opacity-70" : "stroke-slate-500 opacity-70"
          )}
        />
      </svg>
      {!isIcon && (
        // <span className={cn(
        //   "font-bold tracking-tight",
        //   variant === "monochrome" ? "text-current" : "text-foreground",
        //   "text-xl"
        // )}>
        <span
        className={cn(
          "font-bold tracking-tight text-xl",
          variant === "monochrome"
            ? "text-current"
            : "text-white dark:text-white"
        )}
>
          Momentum<span className={variant === "monochrome" ? "opacity-80" : "text-accent"}>.ai</span>
        </span>
      )}
    </div>
  );
}

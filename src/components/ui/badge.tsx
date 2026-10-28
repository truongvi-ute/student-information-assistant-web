import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#1D4ED8] text-white hover:bg-[#1E40AF]",
        secondary:
          "border-[#E2E8F0] bg-[#F1F5F9] text-[#475569]",
        destructive:
          "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]",
        outline:
          "border-[#CBD5E1] text-[#475569]",
        advisor:
          "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
        student:
          "border-[#E2E8F0] bg-[#F1F5F9] text-[#475569]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

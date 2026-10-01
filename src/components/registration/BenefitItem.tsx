import React from "react";

interface BenefitItemProps {
  icon: React.ReactNode;
  iconBgColor?: string;
  title: string;
  description: string;
}

export const BenefitItem: React.FC<BenefitItemProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="flex items-center gap-4 py-1">
      <div
        className="w-[54px] h-[54px] shrink-0 rounded-[10px] flex items-center justify-center border border-white/10"
        style={{
          background: "rgba(18, 38, 77, 0.65)",
          backdropFilter: "blur(6px)",
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold text-[16px] leading-tight">
          {title}
        </h3>
        <p className="text-[#9cb3d8] text-[13.5px] mt-1 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
};

import React, { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}

export function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4E0] p-5 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[#FDF0EB] text-[#E85D2C] border border-[#FADBD8] flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-[#5A554F] uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-[#1E1A18] mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

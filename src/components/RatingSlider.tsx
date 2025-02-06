import React from 'react';

interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function RatingSlider({ label, value, onChange }: RatingSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-32 text-sm font-medium text-gray-700">{label}</label>
      <input
        type="range"
        min="1"
        max="5"
        step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-48"
      />
      <span className="w-12 text-sm font-medium text-gray-700">{value}</span>
    </div>
  );
}
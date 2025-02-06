import React from 'react';
import { ImageRating } from '../types';

interface ImageGridProps {
  ratings: ImageRating[];
  currentIndex: number;
  onSelectImage: (idx: number) => void;
}

export function ImageGrid({ ratings, currentIndex, onSelectImage }: ImageGridProps) {
  return (
    <div className="fixed right-0 top-0 h-screen w-64 bg-white p-4 shadow-lg overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Image Progress</h2>
      <div className="grid grid-cols-4 gap-2">
        {ratings.map((rating) => (
          <button
            key={rating.idx}
            onClick={() => onSelectImage(rating.idx)}
            className={`p-2 text-sm font-medium rounded ${
              rating.modelRatings.length === 5
                ? 'bg-green-100 text-green-800'
                : rating.idx === currentIndex
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {rating.idx}
          </button>
        ))}
      </div>
    </div>
  );
}
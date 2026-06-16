'use client';

import React, { useEffect, useState } from 'react';
import PinCard, { Post } from './PinCard';

interface MasonryGridProps {
  items: Post[];
}

export default function MasonryGrid({ items }: MasonryGridProps) {
  const [columnsCount, setColumnsCount] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setColumnsCount(1);
      } else if (window.innerWidth < 768) {
        setColumnsCount(2);
      } else if (window.innerWidth < 1024) {
        setColumnsCount(3);
      } else {
        setColumnsCount(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Programmatically distribute items evenly (round-robin) across the columns
  const columns: Post[][] = Array.from({ length: columnsCount }, () => []);
  items.forEach((item, index) => {
    columns[index % columnsCount].push(item);
  });

  return (
    <div className="flex gap-4 w-full transition-all duration-500">
      {columns.map((columnItems, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-4 flex-1">
          {columnItems.map((post) => (
            <PinCard key={post.id} post={post} />
          ))}
        </div>
      ))}
    </div>
  );
}

import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  borderRadius?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  height = 'h-4',
  width = 'w-full',
  borderRadius = 'rounded'
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${height} ${width} ${borderRadius} ${className}`}
      aria-hidden="true"
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ 
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 && lines > 1 ? 'w-4/5' : 'w-full'} 
        />
      ))}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div className={`border rounded-lg p-4 ${className}`} aria-hidden="true">
      <Skeleton height="h-4" width="w-3/4" className="mb-4" />
      <SkeletonText lines={2} className="mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton height="h-8" width="w-24" borderRadius="rounded-md" />
        <Skeleton height="h-8" width="w-8" borderRadius="rounded-full" />
      </div>
    </div>
  );
};

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ 
  rows = 5,
  columns = 4,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`} aria-hidden="true">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height="h-6" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
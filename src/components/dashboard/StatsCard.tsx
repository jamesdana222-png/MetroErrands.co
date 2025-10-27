'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease';
  };
  bgColor?: string;
}

export default function StatsCard({ title, value, icon, change, bgColor = 'bg-white dark:bg-gray-800' }: StatsCardProps) {
  return (
    <div className={`${bgColor} overflow-hidden shadow rounded-lg`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {change && (
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
          <div className="text-sm">
            <span
              className={`font-medium ${
                change.type === 'increase'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              } hover:underline`}
            >
              {change.type === 'increase' ? '↑' : '↓'} {change.value}
              {typeof change.value === 'number' ? '%' : ''}
            </span>{' '}
            <span className="text-gray-500 dark:text-gray-400">from previous period</span>
          </div>
        </div>
      )}
    </div>
  );
}
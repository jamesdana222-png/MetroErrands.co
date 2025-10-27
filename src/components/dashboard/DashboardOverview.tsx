'use client';

import { useState, useEffect } from 'react';
import { BarChart, Activity, Users, Clock } from 'lucide-react';

type Stat = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change: string;
  trend: 'up' | 'down' | 'neutral';
};

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stat[]>([
    {
      title: 'Total Errands',
      value: 0,
      icon: Activity,
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'Active Employees',
      value: 0,
      icon: Users,
      change: '+5%',
      trend: 'up',
    },
    {
      title: 'Avg. Completion Time',
      value: '0h',
      icon: Clock,
      change: '-8%',
      trend: 'down',
    },
    {
      title: 'Revenue',
      value: '$0',
      icon: BarChart,
      change: '+18%',
      trend: 'up',
    },
  ]);

  // Simulate loading data
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      setStats([
        {
          title: 'Total Errands',
          value: 248,
          icon: Activity,
          change: '+12%',
          trend: 'up',
        },
        {
          title: 'Active Employees',
          value: 24,
          icon: Users,
          change: '+5%',
          trend: 'up',
        },
        {
          title: 'Avg. Completion Time',
          value: '3.2h',
          icon: Clock,
          change: '-8%',
          trend: 'down',
        },
        {
          title: 'Revenue',
          value: '$12,450',
          icon: BarChart,
          change: '+18%',
          trend: 'up',
        },
      ]);
    }, 1000);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                  {stat.value}
                </h3>
              </div>
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="mt-4">
              <span
                className={`text-sm font-medium ${
                  stat.trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : stat.trend === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {stat.change} from last month
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
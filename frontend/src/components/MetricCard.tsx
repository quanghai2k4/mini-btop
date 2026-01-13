import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  percent?: number;
  iconColor: string;
  iconBgColor: string;
  gradientId: string;
  gradientColor: string;
  chartData?: { value: number }[];
  useChart?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  percent = 0,
  iconColor,
  iconBgColor,
  gradientId,
  gradientColor,
  chartData,
  useChart = false,
}) => {
  return (
    <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${iconBgColor}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          {value}
        </div>
        {subValue && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-3">
            {subValue}
          </p>
        )}

        {useChart && chartData ? (
          <div className="h-[40px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={gradientColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            <Progress value={percent} className="h-2" />
            <div className="flex justify-end">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {percent.toFixed(1)}% Used
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

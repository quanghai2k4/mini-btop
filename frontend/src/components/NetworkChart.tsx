import { memo } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface NetworkChartProps {
  data: { value: number }[];
  gradientId: string;
  gradientColor: string;
}

function NetworkChartInner({ data, gradientId, gradientColor }: NetworkChartProps) {
  return (
    <div className="h-[40px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
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
            isAnimationActive={true}
            animationDuration={300}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(NetworkChartInner);

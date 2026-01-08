import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
}

export default function SummaryCard({
  title,
  value,
  prefix,
  suffix,
}: SummaryCardProps) {
  return (
    <Card className="shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 h-[40px] flex items-start">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold truncate">
          {prefix && (
            <span className="mr-1 text-lg font-normal text-gray-400">
              {prefix}
            </span>
          )}
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-normal text-gray-400">
              {suffix}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

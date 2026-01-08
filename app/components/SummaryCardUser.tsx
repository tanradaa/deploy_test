"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SummaryCardUserProps {
  title: string;         
  value: string | number; 
  prefix?: string;        
  suffix?: string;        
}

export default function SummaryCardUser({
  title,
  value,
  prefix = "",
  suffix = "",
}: SummaryCardUserProps) {
  return (
    <Card className="rounded-xl hover:shadow-md transition">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">
          {prefix}
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix}
        </p>
      </CardContent>
    </Card>
  );
}

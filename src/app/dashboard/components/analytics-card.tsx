"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Props {
  title: string;
  value: string;
  description?: string;
}

export default function AnalyticsCard({
  title,
  value,
  description,
}: Props) {
  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      <CardContent className="p-4 space-y-2">
        <p className="text-sm text-muted-foreground truncate">
          {title}
        </p>

        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
          {value}
        </h2>

        {description && (
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Layers } from 'lucide-react';

export interface DiscussionTopicItem {
  topic: string;
  key_points: string[];
}

export function DiscussionTopicsSection({
  title,
  topics,
}: {
  title: string;
  topics: DiscussionTopicItem[];
}) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="space-y-3 max-w-full min-w-0">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
        <span>
          {title} ({topics.length})
        </span>
      </h3>
      <div className="space-y-3 max-w-full">
        {topics.map((topic, idx) => (
          <Card key={idx} className="border-border/60 bg-card/40 max-w-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 min-w-0">
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30 shrink-0"
                >
                  #{idx + 1}
                </Badge>
                <span className="break-words min-w-0">{topic.topic}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-foreground/90 list-disc list-inside">
                {topic.key_points.map((pt, pIdx) => (
                  <li key={pIdx} className="leading-relaxed break-words">
                    {pt}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


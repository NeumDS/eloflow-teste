
import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelative } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KIND_LABELS } from '@/lib/feed/types';
import type { FeedItem } from '@/lib/feed/types';

interface FeedCardProps {
  item: FeedItem;
}

export const FeedCard: React.FC<FeedCardProps> = ({ item }) => {
  const links: Partial<Record<FeedItem['kind'], string>> = {
    job: `/candidato/vaga/${item.id}`,
    project: `/candidato/projetos/${item.id}`,
    challenge: `/candidato/desafios/${item.id}`,
    simulation: `/candidato/simulacao/${item.id}`,
  };

  const link = links[item.kind];

  return (
    <Card className="overflow-hidden rounded-lg">
      <CardHeader className="bg-muted/30 p-4">
        <CardTitle className="text-sm font-medium text-primary">
          {KIND_LABELS[item.kind]}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Por {item.author_name}
        </p>
      </CardHeader>

      <CardContent className="p-4">
        {item.kind !== 'post' && (
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold">
            {item.title}
          </h3>
        )}

        {item.content && (
          <p className="whitespace-pre-wrap text-sm">
            {item.content}
          </p>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          {formatRelative(new Date(item.created_at), new Date(), {
            locale: ptBR,
          })}
        </p>
      </CardContent>

      {link && (
        <CardFooter className="flex justify-end p-4 pt-0">
          <Button asChild size="sm" variant="outline">
            <a href={link}>Ver detalhes</a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelative } from 'date-fns';
import type { Job, Project, Challenge, Simulation } from '@/lib/feed/types';

export type FeedItem = Job | Project | Challenge | Simulation;

interface FeedCardProps {
  item: FeedItem;
}

/**
 * Simple card component to display a feed item.
 * It infers the kind based on the presence of distinctive fields.
 */
export const FeedCard: React.FC<FeedCardProps> = ({ item }) => {
  const getKind = () => {
    if ('title' in item && 'salary_range' in item) return 'Vaga';
    if ('title' in item && 'github_url' in item) return 'Projeto';
    if ('title' in item && 'competencies' in item) return 'Desafio';
    if ('title' in item && 'questions' in item) return 'Simulação';
    return 'Item';
  };

  const kind = getKind();
  const title = 'title' in item ? item.title : '';
  const createdAt = 'created_at' in item ? new Date(item.created_at) : new Date();

  const link = (() => {
    switch (kind) {
      case 'Vaga':
        return `/candidato/vaga/${(item as Job).id}`;
      case 'Projeto':
        return `/candidato/projetos/${(item as Project).id}`;
      case 'Desafio':
        return `/candidato/desafios/${(item as Challenge).id}`;
      case 'Simulação':
        return `/candidato/simulacao/${(item as Simulation).id}`;
      default:
        return '#';
    }
  })();

  return (
<Card className="rounded-lg overflow-hidden">
      <CardHeader className="bg-muted/30 p-4">
        <CardTitle className="text-sm font-medium text-primary">{kind}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-2 mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{formatRelative(createdAt, new Date())}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button asChild size="sm" variant="outline">
          <a href={link}>Ver detalhes</a>
        </Button>
      </CardFooter>
    </Card>
  );
};

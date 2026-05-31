'use client';

import {ChevronDown, ChevronUp, ChevronsUpDown} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {SeverityBadge, StatusBadge} from './badges';
import {formatShortDateTime} from '@/lib/format';
import type {Alert, AlertField} from '@/lib/types';
import type {SortDir, SortKey} from '@/lib/filters';
import {cn} from '@/lib/utils';

interface Props {
  alerts: Alert[];
  selectedId: string | null;
  onSelect: (alert: Alert) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

const COLUMNS: {key: SortKey; label: string}[] = [
  {key: 'id', label: 'ID'},
  {key: 'title', label: 'Title'},
  {key: 'severity', label: 'Severity'},
  {key: 'status', label: 'Status'},
  {key: 'source', label: 'Source'},
  {key: 'createdAt', label: 'Created'},
  {key: 'assignee', label: 'Assignee'},
];

// Red treatment for a cell whose field failed to parse.
function cellClass(bad: boolean, base = ''): string {
  return cn(base, bad && 'bg-destructive/10 text-destructive');
}

const MISSING = <span className="text-destructive">—</span>;

export function AlertTable({
  alerts,
  selectedId,
  onSelect,
  sortKey,
  sortDir,
  onSort,
}: Props) {
  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          {COLUMNS.map(c => (
            <TableHead key={c.key}>
              <button
                type="button"
                onClick={() => onSort(c.key)}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {c.label}
                {sortKey === c.key ? (
                  sortDir === 'asc' ? (
                    <ChevronUp className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )
                ) : (
                  <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />
                )}
              </button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COLUMNS.length}
              className="h-24 text-center text-muted-foreground"
            >
              No alerts match the current filters.
            </TableCell>
          </TableRow>
        ) : (
          alerts.map(alert => {
            const bad = (f: AlertField) => alert.invalidFields.includes(f);
            return (
              <TableRow
                key={alert.id}
                onClick={() => onSelect(alert)}
                data-state={alert.id === selectedId ? 'selected' : undefined}
                className="cursor-pointer"
              >
                <TableCell
                  className={cellClass(
                    bad('id'),
                    'font-mono text-xs text-muted-foreground'
                  )}
                >
                  {alert.id}
                </TableCell>
                <TableCell
                  className={cellClass(
                    bad('title'),
                    'max-w-[22rem] truncate font-medium'
                  )}
                >
                  {alert.title ?? MISSING}
                </TableCell>
                <TableCell className={cellClass(bad('severity'))}>
                  {alert.severity ? (
                    <SeverityBadge severity={alert.severity} />
                  ) : (
                    MISSING
                  )}
                </TableCell>
                <TableCell className={cellClass(bad('status'))}>
                  {alert.status ? (
                    <StatusBadge status={alert.status} />
                  ) : (
                    MISSING
                  )}
                </TableCell>
                <TableCell
                  className={cellClass(bad('source'), 'text-muted-foreground')}
                >
                  {alert.source ?? MISSING}
                </TableCell>
                <TableCell
                  className={cellClass(
                    bad('createdAt'),
                    'text-muted-foreground'
                  )}
                >
                  {formatShortDateTime(alert.createdAt)}
                </TableCell>
                <TableCell
                  className={cellClass(
                    bad('assignee'),
                    'text-muted-foreground'
                  )}
                >
                  {alert.assignee ?? alert.assigneeRaw ?? '—'}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

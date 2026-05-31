'use client';

import {Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {UploadButton} from './upload-dropzone';
import {cn} from '@/lib/utils';
import {
  SEVERITIES,
  STATUSES,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from '@/lib/types';
import type {FilterState} from '@/lib/filters';

interface Props {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  sources: string[];
  shown: number;
  total: number;
  issuesCount: number;
  onFile: (file: File) => void;
  busy: boolean;
}

export function AlertToolbar({
  filters,
  onChange,
  sources,
  shown,
  total,
  issuesCount,
  onFile,
  busy,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={e => onChange({search: e.target.value})}
          placeholder="Search title, id, assignee…"
          className="w-64 pl-8"
        />
      </div>

      <FilterSelect
        value={filters.severity}
        onValueChange={v => onChange({severity: v as FilterState['severity']})}
        allLabel="All severities"
        options={SEVERITIES.map(s => ({value: s, label: SEVERITY_LABELS[s]}))}
      />
      <FilterSelect
        value={filters.status}
        onValueChange={v => onChange({status: v as FilterState['status']})}
        allLabel="All statuses"
        options={STATUSES.map(s => ({value: s, label: STATUS_LABELS[s]}))}
      />
      <FilterSelect
        value={filters.source}
        onValueChange={v => onChange({source: v as FilterState['source']})}
        allLabel="All sources"
        options={sources.map(s => ({value: s, label: s}))}
      />

      {(issuesCount > 0 || filters.issuesOnly) && (
        <Button
          variant={filters.issuesOnly ? 'default' : 'outline'}
          size="sm"
          aria-pressed={filters.issuesOnly}
          onClick={() => onChange({issuesOnly: !filters.issuesOnly})}
          className={cn(
            filters.issuesOnly &&
              'bg-destructive text-white hover:bg-destructive/90'
          )}
        >
          Issues only ({issuesCount})
        </Button>
      )}

      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {shown} of {total}
        </span>
        <UploadButton onFile={onFile} busy={busy} />
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onValueChange,
  allLabel,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  allLabel: string;
  options: {value: string; label: string}[];
}) {
  const items = [{value: 'all', label: allLabel}, ...options];
  return (
    <Select
      items={items}
      value={value}
      onValueChange={v => onValueChange(String(v))}
    >
      <SelectTrigger size="sm" className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {items.map(o => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

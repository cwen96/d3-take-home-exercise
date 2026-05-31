'use client';

import {Separator} from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {SeverityBadge, StatusBadge} from './badges';
import {formatAge, formatDateTime} from '@/lib/format';
import {cn} from '@/lib/utils';
import {
  STATUSES,
  STATUS_LABELS,
  type Alert,
  type AlertField,
  type Status,
} from '@/lib/types';

interface Props {
  alert: Alert | null;
  onChangeStatus: (id: string, status: Status) => void;
}

const STATUS_ITEMS = STATUSES.map(s => ({value: s, label: STATUS_LABELS[s]}));

const FIELD_LABELS: Record<AlertField, string> = {
  id: 'ID',
  title: 'Title',
  severity: 'Severity',
  status: 'Status',
  source: 'Source',
  createdAt: 'Created',
  assignee: 'Assignee',
};

export function AlertDetail({alert, onChangeStatus}: Props) {
  if (!alert) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Select an alert to view details and change its status.
      </div>
    );
  }

  const bad = (f: AlertField) => alert.invalidFields.includes(f);

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {alert.severity ? (
            <SeverityBadge severity={alert.severity} />
          ) : (
            <span className="text-xs font-medium text-destructive">
              No severity
            </span>
          )}
          {alert.status ? (
            <StatusBadge status={alert.status} />
          ) : (
            <span className="text-xs font-medium text-destructive">
              No status
            </span>
          )}
        </div>
        <h2
          className={cn(
            'text-lg leading-snug font-semibold',
            bad('title') && 'text-destructive'
          )}
        >
          {alert.title ?? 'Untitled alert'}
        </h2>
        <p
          className={cn(
            'font-mono text-xs text-muted-foreground',
            bad('id') && 'text-destructive'
          )}
        >
          {alert.id}
        </p>
      </div>

      {alert.invalidFields.length > 0 && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Missing or invalid:{' '}
          {alert.invalidFields.map(f => FIELD_LABELS[f]).join(', ')}
        </p>
      )}

      <Separator />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Field
          label="Source"
          value={alert.source ?? '—'}
          invalid={bad('source')}
        />
        <Field
          label="Assignee"
          value={alert.assignee ?? alert.assigneeRaw ?? 'Unassigned'}
          invalid={bad('assignee')}
        />
        <Field
          label="Created"
          value={formatDateTime(alert.createdAt)}
          invalid={bad('createdAt')}
        />
        <Field
          label="Age"
          value={formatAge(alert.createdAt)}
          invalid={bad('createdAt')}
        />
      </dl>

      <Separator />

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Status</label>
        <Select
          items={STATUS_ITEMS}
          value={alert.status}
          onValueChange={value => onChangeStatus(alert.id, value as Status)}
        >
          <SelectTrigger
            className={cn('w-full', !alert.status && 'text-destructive')}
          >
            {alert.status ? STATUS_LABELS[alert.status] : 'Set a status…'}
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {STATUS_ITEMS.map(s => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Persists to the mock database via PATCH /api/alerts/{alert.id}.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  invalid,
}: {
  label: string;
  value: string;
  invalid?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn('font-medium break-words', invalid && 'text-destructive')}
      >
        {value}
      </dd>
    </div>
  );
}

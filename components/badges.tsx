import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  type Severity,
  type Status,
} from '@/lib/types';

const SEVERITY_CLASSES: Record<Severity, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-400 text-amber-950',
  low: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

export function SeverityBadge({severity}: {severity: Severity}) {
  return (
    <Badge className={cn('border-transparent', SEVERITY_CLASSES[severity])}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}

const STATUS_CLASSES: Record<Status, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  in_progress:
    'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  dismissed:
    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export function StatusBadge({status}: {status: Status}) {
  return (
    <Badge className={cn('border-transparent', STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

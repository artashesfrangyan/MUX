import { describeInstanceState, type InstanceState } from '@shared/api';
import { Alert } from '@shared/ui';

interface InstanceStateNoticeProps {
  state: InstanceState | null;
}

export function InstanceStateNotice({ state }: InstanceStateNoticeProps) {
  if (!state) return null;
  const { level, text } = describeInstanceState(state);
  if (level !== 'error' && level !== 'warning') return null;

  return <Alert tone={level}>{text}</Alert>;
}

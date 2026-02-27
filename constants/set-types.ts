import { Colors } from './Colors';

export type SetType = 'warmup' | 'working' | 'myoRep' | 'dropSet';

export interface SetTypeConfig {
  id: SetType;
  label: string;
  shortLabel: string;
  color: string;
  icon: 'fire' | 'bolt' | 'pause' | 'chevron-down';
}

export const SET_TYPES: Record<SetType, SetTypeConfig> = {
  warmup: {
    id: 'warmup',
    label: 'Warmup',
    shortLabel: 'WARM',
    color: Colors.warmup,
    icon: 'fire',
  },
  working: {
    id: 'working',
    label: 'Working',
    shortLabel: 'WORK',
    color: Colors.working,
    icon: 'bolt',
  },
  dropSet: {
    id: 'dropSet',
    label: 'Drop Set',
    shortLabel: 'DROP',
    color: Colors.dropSet,
    icon: 'chevron-down',
  },
  myoRep: {
    id: 'myoRep',
    label: 'Rest-Pause',
    shortLabel: 'R-P',
    color: Colors.myoRep,
    icon: 'pause',
  },
};

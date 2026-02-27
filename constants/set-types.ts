import { Colors } from './Colors';

export type SetType = 'warmup' | 'working' | 'myoRep' | 'dropSet';

export interface SetTypeConfig {
  id: SetType;
  label: string;
  shortLabel: string;
  color: string;
  icon: string;
}

export const SET_TYPES: Record<SetType, SetTypeConfig> = {
  warmup: {
    id: 'warmup',
    label: 'Warmup',
    shortLabel: 'W',
    color: Colors.warmup,
    icon: '🔥',
  },
  working: {
    id: 'working',
    label: 'Working',
    shortLabel: 'W',
    color: Colors.working,
    icon: '🎯',
  },
  myoRep: {
    id: 'myoRep',
    label: 'Myo-Rep',
    shortLabel: 'MR',
    color: Colors.myoRep,
    icon: '⚡',
  },
  dropSet: {
    id: 'dropSet',
    label: 'Drop Set',
    shortLabel: 'D',
    color: Colors.dropSet,
    icon: '💧',
  },
};

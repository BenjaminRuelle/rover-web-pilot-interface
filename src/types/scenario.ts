
export type NodeType = 'condition' | 'action' | 'logic';

export interface ScenarioNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: any;
  };
}

export interface ConditionConfig {
  type: 'person_detected' | 'temperature_above' | 'time_between' | 'motion_detected';
  threshold?: number;
  temperature?: number;
  startTime?: string;
  endTime?: string;
  zone?: string;
}

export interface ActionConfig {
  type: 'trigger_alarm' | 'move_to_location' | 'send_notification' | 'capture_image';
  message?: string;
  location?: { x: number; y: number };
  recipient?: string;
}

export interface LogicConfig {
  operator: 'AND' | 'OR' | 'NOT';
}

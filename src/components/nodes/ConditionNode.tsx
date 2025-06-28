
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Eye } from 'lucide-react';

interface ConditionNodeProps {
  data: {
    label: string;
    config: any;
  };
}

export const ConditionNode: React.FC<ConditionNodeProps> = ({ data }) => {
  const getConditionDetails = () => {
    const { config } = data;
    switch (config?.type) {
      case 'temperature_above':
        return `> ${config.temperature || 25}°C`;
      case 'time_between':
        return `${config.startTime || '19:00'} - ${config.endTime || '08:00'}`;
      case 'person_detected':
      case 'motion_detected':
        return `Threshold: ${config.threshold || 0.8}`;
      default:
        return '';
    }
  };

  return (
    <div className="bg-blue-600 border-2 border-blue-500 rounded-lg p-3 min-w-[150px] shadow-lg">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      
      <div className="flex items-center space-x-2 mb-1">
        <Eye className="w-4 h-4 text-white" />
        <span className="text-xs text-blue-100 font-medium">CONDITION</span>
      </div>
      
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-white font-medium text-sm">{data.label}</span>
      </div>
      
      {getConditionDetails() && (
        <div className="text-xs text-blue-100 opacity-80">
          {getConditionDetails()}
        </div>
      )}
      
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

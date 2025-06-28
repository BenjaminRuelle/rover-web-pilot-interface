
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

interface ActionNodeProps {
  data: {
    label: string;
    config: any;
  };
}

export const ActionNode: React.FC<ActionNodeProps> = ({ data }) => {
  const getActionIcon = () => {
    switch (data.config?.type) {
      case 'trigger_alarm':
        return '🚨';
      case 'move_to_location':
        return '🤖';
      case 'send_notification':
        return '📧';
      case 'capture_image':
        return '📸';
      default:
        return '⚡';
    }
  };

  const getActionDetails = () => {
    const { config } = data;
    switch (config?.type) {
      case 'trigger_alarm':
      case 'send_notification':
        return config.message || 'Alert!';
      case 'move_to_location':
        return config.location ? `(${config.location.x}, ${config.location.y})` : '(0, 0)';
      case 'capture_image':
        return 'Take photo';
      default:
        return '';
    }
  };

  return (
    <div className="bg-green-600 border-2 border-green-500 rounded-lg p-3 min-w-[150px] shadow-lg">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      
      <div className="flex items-center space-x-2 mb-1">
        <Zap className="w-4 h-4 text-white" />
        <span className="text-xs text-green-100 font-medium">ACTION</span>
      </div>
      
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{getActionIcon()}</span>
        <span className="text-white font-medium text-sm">{data.label}</span>
      </div>
      
      {getActionDetails() && (
        <div className="text-xs text-green-100 opacity-80 truncate">
          {getActionDetails()}
        </div>
      )}
      
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

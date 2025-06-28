
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface LogicNodeProps {
  data: {
    label: string;
    config: any;
  };
}

export const LogicNode: React.FC<LogicNodeProps> = ({ data }) => {
  const getLogicSymbol = () => {
    switch (data.config?.operator) {
      case 'AND':
        return '&';
      case 'OR':
        return '|';
      case 'NOT':
        return '!';
      default:
        return '&';
    }
  };

  const getLogicColor = () => {
    switch (data.config?.operator) {
      case 'AND':
        return 'bg-purple-600 border-purple-500';
      case 'OR':
        return 'bg-orange-600 border-orange-500';
      case 'NOT':
        return 'bg-red-600 border-red-500';
      default:
        return 'bg-purple-600 border-purple-500';
    }
  };

  return (
    <div className={`${getLogicColor()} border-2 rounded-lg p-3 min-w-[120px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center space-x-2 mb-1">
        <GitBranch className="w-4 h-4 text-white" />
        <span className="text-xs text-white opacity-80 font-medium">LOGIC</span>
      </div>
      
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl font-bold text-white">{getLogicSymbol()}</span>
        <span className="text-white font-medium text-sm">{data.config?.operator || 'AND'}</span>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

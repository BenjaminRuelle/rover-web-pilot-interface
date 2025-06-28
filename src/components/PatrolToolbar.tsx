
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Square, Hand, Save, Trash2 } from 'lucide-react';

export type PatrolTool = 'select' | 'waypoint' | 'keepout';

interface PatrolToolbarProps {
  activeTool?: PatrolTool;
  onToolChange?: (tool: PatrolTool) => void;
  onSave?: () => void;
  onClear?: () => void;
}

const PatrolToolbar: React.FC<PatrolToolbarProps> = ({
  activeTool = 'select',
  onToolChange = () => {},
  onSave = () => {},
  onClear = () => {}
}) => {
  return (
    <div className="bg-slate-800 border-b border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-white text-lg font-semibold mr-6">Patrol Planning</h2>
          
          <Button
            variant={activeTool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('select')}
            className="flex items-center gap-2"
          >
            <Hand className="w-4 h-4" />
            Select
          </Button>
          
          <Button
            variant={activeTool === 'waypoint' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('waypoint')}
            className="flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Patrol Points
          </Button>
          
          <Button
            variant={activeTool === 'keepout' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolChange('keepout')}
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Keepout Zone
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="flex items-center gap-2 text-red-400 border-red-400 hover:bg-red-400/10"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
          
          <Button
            size="sm"
            onClick={onSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save Route
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatrolToolbar;

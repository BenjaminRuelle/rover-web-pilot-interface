
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { ScenarioNode } from '@/types/scenario';

interface NodeConfigSidebarProps {
  node: ScenarioNode | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateConfig: (nodeId: string, config: any) => void;
}

const NodeConfigSidebar: React.FC<NodeConfigSidebarProps> = ({
  node,
  isOpen,
  onClose,
  onUpdateConfig,
}) => {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {});
    }
  }, [node]);

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (node) {
      onUpdateConfig(node.id, newConfig);
    }
  };

  if (!isOpen || !node) {
    return null;
  }

  const renderConfigFields = () => {
    switch (node.type) {
      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white">Condition Type</Label>
              <Select
                value={config.type || 'person_detected'}
                onValueChange={(value) => handleConfigChange('type', value)}
              >
                <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="person_detected">Person Detected</SelectItem>
                  <SelectItem value="temperature_above">Temperature Above</SelectItem>
                  <SelectItem value="time_between">Time Between</SelectItem>
                  <SelectItem value="motion_detected">Motion Detected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.type === 'temperature_above' && (
              <div>
                <Label className="text-white">Temperature (°C)</Label>
                <Input
                  type="number"
                  value={config.temperature || 25}
                  onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>
            )}

            {config.type === 'time_between' && (
              <div className="space-y-2">
                <div>
                  <Label className="text-white">Start Time</Label>
                  <Input
                    type="time"
                    value={config.startTime || '19:00'}
                    onChange={(e) => handleConfigChange('startTime', e.target.value)}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">End Time</Label>
                  <Input
                    type="time"
                    value={config.endTime || '08:00'}
                    onChange={(e) => handleConfigChange('endTime', e.target.value)}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
              </div>
            )}

            {(config.type === 'person_detected' || config.type === 'motion_detected') && (
              <div>
                <Label className="text-white">Detection Threshold</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.threshold || 0.8}
                  onChange={(e) => handleConfigChange('threshold', parseFloat(e.target.value))}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>
            )}
          </div>
        );

      case 'action':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white">Action Type</Label>
              <Select
                value={config.type || 'trigger_alarm'}
                onValueChange={(value) => handleConfigChange('type', value)}
              >
                <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="trigger_alarm">Trigger Alarm</SelectItem>
                  <SelectItem value="move_to_location">Move to Location</SelectItem>
                  <SelectItem value="send_notification">Send Notification</SelectItem>
                  <SelectItem value="capture_image">Capture Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(config.type === 'trigger_alarm' || config.type === 'send_notification') && (
              <div>
                <Label className="text-white">Message</Label>
                <Input
                  value={config.message || 'Alert!'}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>
            )}

            {config.type === 'move_to_location' && (
              <div className="space-y-2">
                <div>
                  <Label className="text-white">X Coordinate</Label>
                  <Input
                    type="number"
                    value={config.location?.x || 0}
                    onChange={(e) => handleConfigChange('location', { 
                      ...config.location, 
                      x: parseFloat(e.target.value) 
                    })}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Y Coordinate</Label>
                  <Input
                    type="number"
                    value={config.location?.y || 0}
                    onChange={(e) => handleConfigChange('location', { 
                      ...config.location, 
                      y: parseFloat(e.target.value) 
                    })}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'logic':
        return (
          <div>
            <Label className="text-white">Logic Operator</Label>
            <Select
              value={config.operator || 'AND'}
              onValueChange={(value) => handleConfigChange('operator', value)}
            >
              <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
                <SelectItem value="NOT">NOT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm text-white">Configure Node</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/80 hover:bg-slate-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Node ID</Label>
            <Input
              value={node.id}
              disabled
              className="bg-slate-600 border-slate-500 text-white/60"
            />
          </div>
          
          <div>
            <Label className="text-white">Label</Label>
            <Input
              value={node.data.label}
              onChange={(e) => onUpdateConfig(node.id, { ...config, label: e.target.value })}
              className="bg-slate-600 border-slate-500 text-white"
            />
          </div>

          {renderConfigFields()}
        </CardContent>
      </Card>
    </div>
  );
};

export default NodeConfigSidebar;

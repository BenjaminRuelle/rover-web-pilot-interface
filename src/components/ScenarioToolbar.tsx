
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NodeType } from '@/types/scenario';
import { Eye, Zap, GitBranch, Download, Plus } from 'lucide-react';

interface ScenarioToolbarProps {
  onAddNode: (type: NodeType) => void;
  onExport: () => void;
}

const ScenarioToolbar: React.FC<ScenarioToolbarProps> = ({ onAddNode, onExport }) => {
  const nodeCategories = [
    {
      title: 'Conditions',
      icon: Eye,
      items: [
        { type: 'condition' as NodeType, label: 'Person Detected' },
        { type: 'condition' as NodeType, label: 'Temperature' },
        { type: 'condition' as NodeType, label: 'Time Range' },
        { type: 'condition' as NodeType, label: 'Motion' },
      ]
    },
    {
      title: 'Actions',
      icon: Zap,
      items: [
        { type: 'action' as NodeType, label: 'Trigger Alarm', icon: '🚨' },
        { type: 'action' as NodeType, label: 'Move Robot', icon: '🤖' },
        { type: 'action' as NodeType, label: 'Send Alert', icon: '📧' },
        { type: 'action' as NodeType, label: 'Capture Image', icon: '📸' },
      ]
    },
    {
      title: 'Logic',
      icon: GitBranch,
      items: [
        { type: 'logic' as NodeType, label: 'AND', icon: '&' },
        { type: 'logic' as NodeType, label: 'OR', icon: '|' },
        { type: 'logic' as NodeType, label: 'NOT', icon: '!' },
      ]
    }
  ];

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Node Library</h2>
          <Button
            onClick={onExport}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {nodeCategories.map((category) => (
          <Card key={category.title} className="bg-slate-700 border-slate-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center">
                <category.icon className="w-4 h-4 mr-2" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.items.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddNode(item.type)}
                  className="w-full justify-start text-white/80 hover:bg-slate-600 hover:text-white"
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  <Plus className="w-3 h-3 mr-2" />
                  {item.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ScenarioToolbar;

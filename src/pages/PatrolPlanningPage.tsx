
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import PatrolMap from '@/components/PatrolMap';
import PatrolToolbar, { PatrolTool } from '@/components/PatrolToolbar';

const PatrolPlanningPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<PatrolTool>('select');

  const handleSave = () => {
    console.log('Saving patrol route from page');
    // In real implementation, this would send data to the robot
  };

  const handleClear = () => {
    console.log('Clearing patrol route from page');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="pt-16 h-screen flex flex-col">
        {/* Toolbar */}
        <PatrolToolbar 
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onSave={handleSave}
          onClear={handleClear}
        />
        
        {/* Map - takes remaining space */}
        <div className="flex-1">
          <PatrolMap 
            activeTool={activeTool}
            onSave={handleSave}
            onClear={handleClear}
          />
        </div>
      </div>
    </div>
  );
};

export default PatrolPlanningPage;

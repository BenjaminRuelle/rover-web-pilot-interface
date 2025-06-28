
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import PatrolMap from '@/components/PatrolMap';
import PatrolToolbar, { PatrolTool } from '@/components/PatrolToolbar';
import PatrolScheduler from '@/components/PatrolScheduler';

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
        
        {/* Main content area */}
        <div className="flex-1 flex">
          {/* Map - takes most of the space */}
          <div className="flex-1">
            <PatrolMap 
              activeTool={activeTool}
              onSave={handleSave}
              onClear={handleClear}
            />
          </div>
          
          {/* Scheduler sidebar */}
          <div className="w-80 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
            <PatrolScheduler />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatrolPlanningPage;

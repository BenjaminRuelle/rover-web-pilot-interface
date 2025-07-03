
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import PatrolMap from '@/components/PatrolMap';
import PatrolToolbar, { PatrolTool } from '@/components/PatrolToolbar';
import PatrolScheduler from '@/components/PatrolScheduler';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMapContext } from '@/contexts/MapContext';

const PatrolPlanningPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<PatrolTool>('select');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const { clearAll } = useMapContext();

  const handleSave = () => {
    console.log('Saving patrol route from page');
    // In real implementation, this would send data to the robot
  };

  const handleClear = () => {
    console.log('Clearing patrol route from page');
    clearAll();
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
        
        {/* Main content area - full layout */}
        <div className="flex-1 relative">
          {/* Map - takes full space */}
          <PatrolMap 
            activeTool={activeTool}
            onSave={handleSave}
            onClear={handleClear}
          />
          
          {/* Schedule toggle button */}
          <div className="absolute top-4 right-4 z-10">
            <Collapsible open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-black/50 backdrop-blur-md border-white/20 text-white hover:bg-black/70"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                  {isScheduleOpen ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="absolute top-full right-0 mt-2 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 p-4 min-w-[320px] max-h-[500px] overflow-y-auto">
                <PatrolScheduler />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatrolPlanningPage;

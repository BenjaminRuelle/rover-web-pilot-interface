
import React from 'react';
import Navbar from '@/components/Navbar';
import PatrolMap from '@/components/PatrolMap';
import PatrolToolbar from '@/components/PatrolToolbar';

const PatrolPlanningPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="pt-16 h-screen flex flex-col">
        {/* Toolbar */}
        <PatrolToolbar />
        
        {/* Map - takes remaining space */}
        <div className="flex-1">
          <PatrolMap />
        </div>
      </div>
    </div>
  );
};

export default PatrolPlanningPage;


import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface PatrolSchedule {
  date: Date;
  timeSlots: TimeSlot[];
}

const PatrolScheduler: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<Map<string, TimeSlot[]>>(new Map());
  const [newTimeSlot, setNewTimeSlot] = useState({ startTime: '09:00', endTime: '10:00' });

  const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

  const getCurrentTimeSlots = (): TimeSlot[] => {
    if (!selectedDate) return [];
    return schedules.get(getDateKey(selectedDate)) || [];
  };

  const addTimeSlot = () => {
    if (!selectedDate) return;
    
    const newSlot: TimeSlot = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime
    };

    const dateKey = getDateKey(selectedDate);
    const currentSlots = schedules.get(dateKey) || [];
    const updatedSlots = [...currentSlots, newSlot];
    
    setSchedules(prev => new Map(prev.set(dateKey, updatedSlots)));
    
    console.log('Added patrol time slot:', {
      date: dateKey,
      timeSlot: newSlot
    });
  };

  const removeTimeSlot = (slotId: string) => {
    if (!selectedDate) return;
    
    const dateKey = getDateKey(selectedDate);
    const currentSlots = schedules.get(dateKey) || [];
    const updatedSlots = currentSlots.filter(slot => slot.id !== slotId);
    
    if (updatedSlots.length === 0) {
      setSchedules(prev => {
        const newMap = new Map(prev);
        newMap.delete(dateKey);
        return newMap;
      });
    } else {
      setSchedules(prev => new Map(prev.set(dateKey, updatedSlots)));
    }
  };

  const hasSchedule = (date: Date) => {
    return schedules.has(getDateKey(date));
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-white" />
        <h3 className="text-lg font-semibold text-white">Patrol Schedule</h3>
      </div>
      
      <div>
        <Label className="text-sm font-medium mb-2 block text-white">Select Date</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border border-white/20 bg-black/20 text-white"
          modifiers={{
            scheduled: (date) => hasSchedule(date)
          }}
          modifiersStyles={{
            scheduled: { backgroundColor: '#3b82f6', color: 'white' }
          }}
        />
      </div>

      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-white">
              Time Slots for {format(selectedDate, 'PPP')}
            </Label>
          </div>

          <div className="space-y-2">
            {getCurrentTimeSlots().map((slot) => (
              <div key={slot.id} className="flex items-center justify-between p-2 bg-white/10 rounded-md border border-white/20">
                <span className="text-sm text-white">
                  {slot.startTime} - {slot.endTime}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTimeSlot(slot.id)}
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/20"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2 p-3 border border-white/20 rounded-md bg-white/5">
            <Label className="text-sm font-medium text-white">Add Time Slot</Label>
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={newTimeSlot.startTime}
                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
                className="flex-1 px-2 py-1 border border-white/20 rounded text-sm bg-black/20 text-white"
              />
              <span className="text-sm text-white/70">to</span>
              <input
                type="time"
                value={newTimeSlot.endTime}
                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, endTime: e.target.value }))}
                className="flex-1 px-2 py-1 border border-white/20 rounded text-sm bg-black/20 text-white"
              />
            </div>
            <Button
              onClick={addTimeSlot}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Slot
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatrolScheduler;

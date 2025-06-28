
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Patrol Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">Select Date</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border pointer-events-auto"
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
              <Label className="text-sm font-medium">
                Time Slots for {format(selectedDate, 'PPP')}
              </Label>
            </div>

            <div className="space-y-2">
              {getCurrentTimeSlots().map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                  <span className="text-sm">
                    {slot.startTime} - {slot.endTime}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTimeSlot(slot.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2 p-3 border rounded-md bg-slate-50">
              <Label className="text-sm font-medium">Add Time Slot</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="time"
                  value={newTimeSlot.startTime}
                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <span className="text-sm text-gray-500">to</span>
                <input
                  type="time"
                  value={newTimeSlot.endTime}
                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, endTime: e.target.value }))}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
              <Button
                onClick={addTimeSlot}
                size="sm"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Slot
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatrolScheduler;

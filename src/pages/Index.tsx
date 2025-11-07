import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type ShiftType = 'morning' | 'day' | 'evening';
type SlotStatus = 'unavailable' | 'free' | 'taken' | 'urgent';
type Role = 'employee' | 'admin';

interface Employee {
  id: string;
  name: string;
  limit: number;
  currentShifts: number;
}

interface Slot {
  id: string;
  type: 'base' | 'extra';
  status: SlotStatus;
  employeeId?: string;
  urgent: boolean;
}

interface Shift {
  date: string;
  dayName: string;
  shifts: {
    morning: Slot[];
    day: Slot[];
    evening: Slot[];
  };
}

const employees: Employee[] = [
  { id: '1', name: 'Анна Иванова', limit: 5, currentShifts: 3 },
  { id: '2', name: 'Петр Смирнов', limit: 6, currentShifts: 5 },
  { id: '3', name: 'Мария Петрова', limit: 4, currentShifts: 2 },
  { id: '4', name: 'Иван Сидоров', limit: 5, currentShifts: 4 },
  { id: '5', name: 'Елена Козлова', limit: 6, currentShifts: 3 },
];

const generateWeekSchedule = (): Shift[] => {
  const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  const dates = ['11.11', '12.11', '13.11', '14.11', '15.11', '16.11', '17.11'];

  return dates.map((date, idx) => ({
    date,
    dayName: days[idx],
    shifts: {
      morning: [
        { id: `${date}-m-1`, type: 'base', status: idx < 2 ? 'taken' : 'free', employeeId: idx < 2 ? '1' : undefined, urgent: false },
        { id: `${date}-m-2`, type: 'extra', status: 'free', urgent: false },
      ],
      day: [
        { id: `${date}-d-1`, type: 'base', status: idx === 3 ? 'urgent' : idx < 2 ? 'taken' : 'free', employeeId: idx < 2 ? '2' : undefined, urgent: idx === 3 },
        { id: `${date}-d-2`, type: 'extra', status: 'free', urgent: false },
      ],
      evening: [
        { id: `${date}-e-1`, type: 'base', status: idx < 3 ? 'taken' : 'free', employeeId: idx < 3 ? '3' : undefined, urgent: false },
        { id: `${date}-e-2`, type: 'extra', status: 'free', urgent: false },
      ],
    },
  }));
};

const Index = () => {
  const [currentRole] = useState<Role>('employee');
  const [schedule, setSchedule] = useState<Shift[]>(generateWeekSchedule());
  const [selectedSlot, setSelectedSlot] = useState<{ slot: Slot; shiftType: ShiftType; date: string } | null>(null);
  const [currentUserId] = useState('1');

  const getSlotColor = (slot: Slot) => {
    if (slot.urgent) return 'bg-[#FEC6A1] border-orange-400 animate-pulse-urgent';
    if (slot.status === 'taken') {
      if (slot.employeeId === currentUserId) return 'bg-primary/20 border-primary';
      return 'bg-muted border-border';
    }
    if (slot.status === 'free') return 'bg-white border-primary/30 hover:border-primary hover:shadow-md transition-all';
    return 'bg-muted/50 border-border';
  };

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case 'morning': return 'Sunrise';
      case 'day': return 'Sun';
      case 'evening': return 'Moon';
    }
  };

  const handleSlotClick = (slot: Slot, shiftType: ShiftType, date: string) => {
    if (slot.status === 'unavailable') return;
    setSelectedSlot({ slot, shiftType, date });
  };

  const handleAssignSlot = (employeeId: string) => {
    if (!selectedSlot) return;

    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    if (currentRole === 'employee' && employeeId !== currentUserId) {
      toast.error('Вы можете выбрать только свое имя');
      return;
    }

    if (employee.currentShifts >= employee.limit) {
      toast.error(`Превышен лимит смен для ${employee.name}`);
      return;
    }

    setSchedule(prevSchedule =>
      prevSchedule.map(shift => {
        if (shift.date !== selectedSlot.date) return shift;
        
        return {
          ...shift,
          shifts: {
            ...shift.shifts,
            [selectedSlot.shiftType]: shift.shifts[selectedSlot.shiftType].map(s =>
              s.id === selectedSlot.slot.id
                ? { ...s, status: 'taken' as SlotStatus, employeeId, urgent: false }
                : s
            ),
          },
        };
      })
    );

    toast.success(`Смена назначена: ${employee.name}`);
    setSelectedSlot(null);
  };

  const handleCancelSlot = (slotId: string, date: string, shiftType: ShiftType) => {
    setSchedule(prevSchedule =>
      prevSchedule.map(shift => {
        if (shift.date !== date) return shift;
        
        return {
          ...shift,
          shifts: {
            ...shift.shifts,
            [shiftType]: shift.shifts[shiftType].map(s =>
              s.id === slotId
                ? { ...s, status: 'free' as SlotStatus, employeeId: undefined }
                : s
            ),
          },
        };
      })
    );

    toast.info('Смена отменена');
  };

  const urgentCount = schedule.reduce((acc, shift) => {
    return acc + 
      shift.shifts.morning.filter(s => s.urgent).length +
      shift.shifts.day.filter(s => s.urgent).length +
      shift.shifts.evening.filter(s => s.urgent).length;
  }, 0);

  const currentEmployee = employees.find(e => e.id === currentUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Управление сменами</h1>
            <p className="text-muted-foreground">Неделя: 11.11 - 17.11.2024</p>
          </div>
          
          <div className="flex items-center gap-3">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="bg-[#FEC6A1] text-[#8B4513] animate-pulse-urgent px-4 py-2">
                <Icon name="AlertCircle" className="mr-2" size={16} />
                {urgentCount} срочных замен
              </Badge>
            )}
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-white font-semibold">
                {currentEmployee?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <Card className="p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Расписание смен</h2>
              <Badge variant="outline" className="bg-[#F2FCE2] text-[#4A7C1F] border-green-200">
                Шаг 1: Базовые смены
              </Badge>
            </div>

            <div className="space-y-6">
              {schedule.map((shift) => (
                <div key={shift.date} className="grid grid-cols-[80px_1fr] gap-4">
                  <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-3">
                    <span className="text-sm font-medium text-muted-foreground">{shift.dayName}</span>
                    <span className="text-lg font-bold">{shift.date}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(['morning', 'day', 'evening'] as ShiftType[]).map((shiftType) => (
                      <div key={shiftType} className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name={getShiftIcon(shiftType)} size={16} className="text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">
                            {shiftType === 'morning' ? 'Утро' : shiftType === 'day' ? 'День' : 'Вечер'}
                          </span>
                        </div>
                        
                        {shift.shifts[shiftType].map((slot, idx) => {
                          const employee = slot.employeeId ? employees.find(e => e.id === slot.employeeId) : null;
                          const isMyShift = slot.employeeId === currentUserId;

                          return (
                            <div
                              key={slot.id}
                              onClick={() => handleSlotClick(slot, shiftType, shift.date)}
                              className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${getSlotColor(slot)} group`}
                            >
                              {slot.urgent && (
                                <Icon name="AlertCircle" size={16} className="absolute top-1 right-1 text-orange-600" />
                              )}
                              
                              {employee ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium truncate">
                                    {employee.name.split(' ')[0]}
                                  </span>
                                  {isMyShift && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelSlot(slot.id, shift.date, shiftType);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Icon name="X" size={14} className="text-destructive" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Icon name="Plus" size={14} />
                                  <span className="text-xs">{idx === 0 ? 'Базовый' : 'Доп.'}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Users" size={20} className="text-primary" />
                <h3 className="text-xl font-semibold">Сотрудники</h3>
              </div>

              <div className="space-y-4">
                {employees.map((emp) => (
                  <div key={emp.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${emp.id === currentUserId ? 'text-primary' : ''}`}>
                        {emp.name}
                        {emp.id === currentUserId && ' (Вы)'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {emp.currentShifts}/{emp.limit}
                      </span>
                    </div>
                    <Progress 
                      value={(emp.currentShifts / emp.limit) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Info" size={20} className="text-primary" />
                <h3 className="text-lg font-semibold">Как работать</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Кликните на свободный слот для выбора смены</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Наведите на свою смену, чтобы отменить</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Пульсирующие слоты — срочные замены</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить сотрудника на смену</DialogTitle>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Смена</p>
                <p className="font-semibold">
                  {selectedSlot.date} • {
                    selectedSlot.shiftType === 'morning' ? 'Утро' : 
                    selectedSlot.shiftType === 'day' ? 'День' : 'Вечер'
                  }
                </p>
              </div>

              <div className="space-y-2">
                {employees.map((emp) => (
                  <Button
                    key={emp.id}
                    variant={emp.id === currentUserId ? 'default' : 'outline'}
                    className="w-full justify-between"
                    onClick={() => handleAssignSlot(emp.id)}
                    disabled={emp.currentShifts >= emp.limit}
                  >
                    <span>{emp.name}</span>
                    <Badge variant={emp.currentShifts >= emp.limit ? 'destructive' : 'secondary'}>
                      {emp.currentShifts}/{emp.limit}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;

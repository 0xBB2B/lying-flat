import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, Trash2, User } from 'lucide-react';
import { Employee, LeaveRecord } from '../types';

interface CalendarViewProps {
  employees: Employee[];
  records: LeaveRecord[];
  onAddRecord: (record: Omit<LeaveRecord, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  employees,
  records,
  onAddRecord,
  onDeleteRecord,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState<'paid' | 'special'>('paid');
  const [days, setDays] = useState(1);
  const [note, setNote] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  const monthNames = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setIsModalOpen(true);
    setSelectedEmployeeId(''); // Reset selection
    setNote(''); // Reset note
    setLeaveType('paid'); // Reset type
    setDays(1); // Reset days
  };

  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedDate) return;

    onAddRecord({
      employeeId: selectedEmployeeId,
      date: selectedDate,
      type: leaveType,
      days: days,
      note: note
    });
    
    // Optional: Close modal or keep open? Let's keep open to see result
    setSelectedEmployeeId('');
    setNote('');
    setDays(1);
  };

  // Get records for the current month to display indicators
  const monthRecords = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return records.filter(r => r.date.startsWith(monthPrefix));
  }, [records, year, month]);

  // Get records for the selected date
  const selectedDateRecords = useMemo(() => {
    if (!selectedDate) return [];
    return records.filter(r => r.date === selectedDate);
  }, [records, selectedDate]);

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || '未知员工';
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRecords = monthRecords.filter(r => r.date === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={`h-24 md:h-32 border border-slate-100 dark:border-slate-800 p-2 cursor-pointer transition-colors hover:bg-teal-50/50 dark:hover:bg-teal-900/10 relative group ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-900'}`}
        >
          <div className={`text-sm font-medium mb-1 flex justify-between items-center ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
            <span className={isToday ? 'bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full' : ''}>{day}</span>
            {dayRecords.length > 0 && (
               <span className="text-xs text-slate-400">{dayRecords.length} 条记录</span>
            )}
          </div>
          
          <div className="space-y-1 overflow-hidden max-h-[calc(100%-24px)]">
            {dayRecords.slice(0, 3).map(record => (
              <div key={record.id} className={`text-xs px-1.5 py-0.5 rounded truncate ${
                record.type === 'paid' 
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300' 
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
              }`}>
                {getEmployeeName(record.employeeId)}
              </div>
            ))}
            {dayRecords.length > 3 && (
              <div className="text-xs text-slate-400 pl-1">
                + {dayRecords.length - 3} 更多
              </div>
            )}
          </div>
          
          {/* Hover Plus Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/5 pointer-events-none">
            <Plus className="text-slate-500" />
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
           <span>{year}年 {monthNames[month]}</span>
        </h2>
        <div className="flex items-center space-x-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft className="text-slate-600 dark:text-slate-400" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            今天
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronRight className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
            <div key={day} className={`py-3 text-center text-sm font-semibold ${index === 0 || index === 6 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Days */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Day Details Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {selectedDate} 请假详情
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Add New Record Form */}
              <form onSubmit={handleAddLeave} className="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Plus size={16} /> 快速添加
                </h4>
                <div className="flex gap-2 mb-3">
                  <select 
                    required
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                  >
                    <option value="">选择员工...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                  >
                    <option value={1}>1天</option>
                    <option value={0.5}>0.5天</option>
                  </select>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                  >
                    <option value="paid">年假</option>
                    <option value="special">特休</option>
                  </select>
                </div>
                
                {/* Reason Input */}
                <div className="mb-3">
                   <input
                     type="text"
                     value={note}
                     onChange={(e) => setNote(e.target.value)}
                     placeholder={leaveType === 'special' ? "特休理由 (必填)" : "备注 (可选)"}
                     required={leaveType === 'special'}
                     className={`w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all ${
                       leaveType === 'special' && !note 
                         ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' 
                         : 'border-slate-300 dark:border-slate-600'
                     }`}
                   />
                </div>

                <button 
                  type="submit" 
                  disabled={!selectedEmployeeId}
                  className="w-full bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  添加记录
                </button>
              </form>

              {/* Existing Records List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">当日记录</h4>
                {selectedDateRecords.length === 0 ? (
                  <p className="text-center text-slate-400 py-4 text-sm">暂无记录</p>
                ) : (
                  selectedDateRecords.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          record.type === 'paid' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' :
                          'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                            {getEmployeeName(record.employeeId)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {record.type === 'paid' ? '年假' : '特休'} · {record.days} 天
                            {record.note && <span className="ml-2 text-slate-400 dark:text-slate-500">({record.note})</span>}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => onDeleteRecord(record.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        title="删除记录"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

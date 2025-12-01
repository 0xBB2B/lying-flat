import React from 'react';
import { Employee } from '../types';
import { UserPlus, ChevronRight, Briefcase, Calendar } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onSelectEmployee: (id: string) => void;
  onAddEmployee: () => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onSelectEmployee, onAddEmployee }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">员工列表</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">查看和管理所有员工的年假余额状态</p>
        </div>
        <button
          onClick={onAddEmployee}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 active:scale-95 font-medium"
        >
          <UserPlus size={18} />
          <span>添加员工</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => {
           return (
            <div 
              key={emp.id}
              onClick={() => onSelectEmployee(emp.id)}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  <ChevronRight className="text-teal-500" />
              </div>

              <div className="flex justify-between items-start mb-5">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors shadow-inner">
                  {emp.name.charAt(0)}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{emp.name}</h3>
              
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                 <Briefcase size={14} className="mr-1.5" />
                 {emp.department || '未分配部门'}
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex items-center text-xs text-slate-400 dark:text-slate-500">
                <Calendar size={12} className="mr-1.5" />
                <span>入职: {emp.hireDate}</span>
              </div>
            </div>
          );
        })}
        
        {employees.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                <UserPlus size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">暂无员工记录</p>
            <p className="text-sm mt-1 mb-4">开始添加您的第一位员工以追踪年假</p>
            <button onClick={onAddEmployee} className="text-teal-600 hover:text-teal-700 font-medium">
                立即添加 &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
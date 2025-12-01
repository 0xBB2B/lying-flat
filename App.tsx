import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeDetail } from './components/EmployeeDetail';
import { Settings } from './components/Settings';
import { CalendarView } from './components/CalendarView';
import { Employee, LeaveRecord } from './types';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'settings' | 'calendar'>('employees');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('japan_leave_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle Theme
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('japan_leave_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('japan_leave_theme', 'light');
      }
      return newMode;
    });
  };

  // Load Data
  useEffect(() => {
    const savedEmp = localStorage.getItem('japan_leave_employees');
    const savedRec = localStorage.getItem('japan_leave_records');
    if (savedEmp) setEmployees(JSON.parse(savedEmp));
    if (savedRec) setRecords(JSON.parse(savedRec));
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('japan_leave_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('japan_leave_records', JSON.stringify(records));
  }, [records]);

  // Actions
  const handleAddEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp = { ...emp, id: generateId() };
    setEmployees([...employees, newEmp]);
    setShowAddEmployeeModal(false);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees(employees.map(e => e.id === updatedEmp.id ? updatedEmp : e));
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
    setRecords(records.filter(r => r.employeeId !== id));
    setSelectedEmployeeId(null);
  };

  const handleAddRecord = (rec: Omit<LeaveRecord, 'id'>) => {
    setRecords([...records, { ...rec, id: generateId() }]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const handleImport = (data: { employees: Employee[], records: LeaveRecord[] }) => {
    setSelectedEmployeeId(null);
    setEmployees(data.employees);
    setRecords(data.records);
    alert(`导入成功！已加载 ${data.employees.length} 名员工和 ${data.records.length} 条记录。`);
    setActiveTab('employees');
  };

  const handleClear = () => {
    setEmployees([]);
    setRecords([]);
    setSelectedEmployeeId(null);
    localStorage.removeItem('japan_leave_employees');
    localStorage.removeItem('japan_leave_records');
    alert('所有数据已清空');
  };

  // Add Employee Form Component
  const AddEmployeeModal = () => {
    const [name, setName] = useState('');
    const [dept, setDept] = useState('');
    const [hireDate, setHireDate] = useState('');

    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      handleAddEmployee({ name, department: dept, hireDate });
      setName('');
      setDept('');
      setHireDate('');
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">添加新员工</h3>
          </div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">姓名</label>
              <input 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">部门</label>
              <input 
                value={dept} 
                onChange={e => setDept(e.target.value)} 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">入职日期</label>
              <input 
                required 
                type="date" 
                value={hireDate} 
                onChange={e => setHireDate(e.target.value)} 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all" 
              />
              <p className="text-xs text-slate-400 mt-2">系统将根据入职日期自动计算符合日本法律的年假额度。</p>
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setShowAddEmployeeModal(false)} 
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                取消
              </button>
              <button 
                type="submit" 
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-medium shadow-lg shadow-teal-900/20"
              >
                添加员工
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'settings') {
      return <Settings employees={employees} records={records} onImport={handleImport} onClear={handleClear} />;
    }

    if (activeTab === 'calendar') {
      return (
        <CalendarView 
          employees={employees} 
          records={records} 
          onAddRecord={handleAddRecord} 
          onDeleteRecord={handleDeleteRecord} 
        />
      );
    }

    if (selectedEmployeeId) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (!emp) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-500 dark:text-slate-400 mb-4">未找到该员工信息</p>
                <button onClick={() => setSelectedEmployeeId(null)} className="text-teal-600 dark:text-teal-400 underline">返回列表</button>
            </div>
        )
      }
      const empRecords = records.filter(r => r.employeeId === selectedEmployeeId);
      return (
        <EmployeeDetail 
          employee={emp} 
          records={empRecords} 
          onBack={() => setSelectedEmployeeId(null)}
          onAddRecord={handleAddRecord}
          onDeleteRecord={handleDeleteRecord}
          onDeleteEmployee={handleDeleteEmployee}
          onUpdateEmployee={handleUpdateEmployee}
          isDarkMode={isDarkMode}
        />
      );
    }

    return (
      <EmployeeList 
        employees={employees} 
        onSelectEmployee={setSelectedEmployeeId} 
        onAddEmployee={() => setShowAddEmployeeModal(true)} 
      />
    );
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={(t) => { setActiveTab(t); setSelectedEmployeeId(null); }}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    >
      {renderContent()}
      {showAddEmployeeModal && <AddEmployeeModal />}
    </Layout>
  );
};

export default App;
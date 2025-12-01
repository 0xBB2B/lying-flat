import React, { useState, useMemo } from 'react';
import { Employee, LeaveRecord } from '../types';
import { calculateLeaveStatus } from '../utils/leaveLogic';
import { ArrowLeft, Calendar, PlusCircle, Trash2, AlertCircle, Clock, Settings2, AlertTriangle, XCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface EmployeeDetailProps {
  employee: Employee;
  records: LeaveRecord[];
  onBack: () => void;
  onAddRecord: (record: Omit<LeaveRecord, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteEmployee: (id: string) => void;
  onUpdateEmployee: (emp: Employee) => void;
  isDarkMode: boolean;
}

export const EmployeeDetail: React.FC<EmployeeDetailProps> = ({
  employee,
  records,
  onBack,
  onAddRecord,
  onDeleteRecord,
  onDeleteEmployee,
  onUpdateEmployee,
  isDarkMode
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [newDate, setNewDate] = useState('');
  const [newDays, setNewDays] = useState(1);
  const [newType, setNewType] = useState<'paid' | 'special'>('paid');
  const [newNote, setNewNote] = useState('');

  const [editBaselineDate, setEditBaselineDate] = useState(employee.baselineDate || '');
  const [editBaselineDays, setEditBaselineDays] = useState(employee.baselineDays?.toString() || '');

  // We use the stats.history for rendering the list now, as it contains deficit info
  const stats = useMemo(() => calculateLeaveStatus(employee, records), [employee, records]);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRecord({
      employeeId: employee.id,
      date: newDate,
      days: Number(newDays),
      type: newType,
      note: newNote
    });
    setShowAddModal(false);
    setNewDate('');
    setNewNote('');
    setNewDays(1);
    setNewType('paid');
  };

  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEmployee({
      ...employee,
      baselineDate: editBaselineDate || undefined,
      baselineDays: editBaselineDays ? Number(editBaselineDays) : undefined
    });
    setShowEditModal(false);
  };

  // Calculate Net Balance (Remaining - Deficit)
  const netBalance = stats.remaining - stats.deficit;
  const isNegative = netBalance < 0;

  // Chart Data Construction
  const chartData = [
    { name: '剩余 (可用)', value: stats.remaining, color: isDarkMode ? '#2dd4bf' : '#0f766e' }, // Teal
    { name: '已用 (带薪)', value: stats.totalUsed, color: isDarkMode ? '#475569' : '#cbd5e1' }, // Slate
    { name: '欠薪 (扣款)', value: stats.deficit, color: isDarkMode ? '#f87171' : '#ef4444' },   // Red
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            <ArrowLeft size={20} />
            </button>
            <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{employee.name}</h2>
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-1">
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-medium">{employee.department || '无部门'}</span>
                <span>•</span>
                <span>入职: {employee.hireDate}</span>
            </div>
            </div>
        </div>
        <div className="flex space-x-3">
            <button 
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
            >
                <Settings2 size={16} />
                调整余额/基准
            </button>
            <button 
                onClick={() => { if(window.confirm('确认删除该员工及其所有记录？')) onDeleteEmployee(employee.id); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-900/50 transition-all"
            >
                <Trash2 size={16} />
                删除员工
            </button>
        </div>
      </div>

      {/* Alert for Salary Deduction */}
      {isNegative && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-start gap-3 animate-fade-in">
           <AlertTriangle className="text-red-600 dark:text-red-400 mt-1 flex-shrink-0" size={24} />
           <div>
             <h4 className="font-bold text-red-800 dark:text-red-300">假期余额不足</h4>
             <p className="text-red-700 dark:text-red-400 text-sm mt-1">
               当前剩余假期为负数（{netBalance} 天）。超出的部分属于无薪缺勤，需要进行工资扣除处理。
             </p>
           </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock size={100} className={isNegative ? 'text-red-600' : 'text-teal-600 dark:text-teal-400'} />
          </div>
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">当前剩余年假</h3>
            <div className={`text-5xl font-extrabold mt-4 tracking-tight ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'}`}>
              {netBalance} <span className="text-xl text-slate-400 dark:text-slate-500 font-medium">天</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                {isNegative ? '包含超额预支/欠薪天数' : '有效期内的可用余额'}
            </p>
          </div>
          <div className="mt-6 h-40 -ml-4">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '10px', right: 0 }}
                    formatter={(value, entry: any) => <span style={{ color: isDarkMode ? '#e2e8f0' : '#334155' }}>{value}</span>}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '8px',
                        color: isDarkMode ? '#fff' : '#0f172a'
                    }} 
                    itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#0f172a' }}
                  />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Grant Details */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-1 md:col-span-2 flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
             <h3 className="text-slate-800 dark:text-white font-bold text-lg">有效授予明细</h3>
             <p className="text-slate-500 dark:text-slate-400 text-sm">根据日本法律规定，年假有效期为2年</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">授予日期</th>
                  <th className="px-6 py-3">过期日期</th>
                  <th className="px-6 py-3">总授予</th>
                  <th className="px-6 py-3">当前剩余</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {stats.grants.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">无有效授予记录</td></tr>
                ) : (
                    stats.grants.map((g, idx) => (
                    <tr key={idx} className={`group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${g.remaining === 0 ? 'opacity-50 grayscale' : ''}`}>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                            {g.date} 
                            {g.isBaseline && <span className="inline-block ml-2 text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">基准</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{g.expiryDate}</td>
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{g.days}</td>
                        <td className="px-6 py-4">
                            <span className={`font-bold px-2 py-1 rounded text-xs ${
                                g.remaining > 0 
                                ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            }`}>
                                {g.remaining}
                            </span>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Leave History Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
            <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    休假记录
                </h3>
            </div>
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-slate-900 dark:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-teal-700 transition-all shadow-lg shadow-slate-900/10 dark:shadow-teal-900/20"
            >
                <PlusCircle size={16} />
                登记请假
            </button>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {stats.history.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-full mb-3">
                        <Calendar size={24} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <span className="text-slate-400 dark:text-slate-500">该员工暂无休假记录</span>
                </div>
            ) : (
                stats.history.map(record => {
                    // Check if this specific record is a deficit record
                    const isDeficit = record.deficitDays > 0;
                    const isPartial = isDeficit && record.deficitDays < record.days;
                    const isFuture = new Date(record.date) > new Date();
                    
                    let containerClass = 'hover:bg-slate-50 dark:hover:bg-slate-700/20';
                    let dateBoxClass = 'bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300';
                    
                    if (isDeficit) {
                        containerClass = 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20';
                        dateBoxClass = 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800';
                    } else if (isFuture) {
                        containerClass = 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20';
                        dateBoxClass = 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
                    }

                    return (
                        <div key={record.id} className={`p-5 transition-colors flex justify-between items-center group ${containerClass}`}>
                            <div className="flex gap-5 items-center">
                                <div className={`px-4 py-2.5 rounded-lg font-mono text-sm flex flex-col items-center justify-center w-28 shadow-sm whitespace-nowrap ${dateBoxClass}`}>
                                    <span className="font-bold">{record.date}</span>
                                    {isFuture && <span className="text-[10px] opacity-80 font-normal mt-0.5">计划中</span>}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-700 dark:text-slate-200 text-lg flex items-center flex-wrap gap-2">
                                        {record.type === 'paid' ? (
                                            isDeficit ? (
                                                <>
                                                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                                        <XCircle size={16} />
                                                        工资扣除
                                                    </span>
                                                    {isPartial && (
                                                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                                            (申请 {record.days} 天, 余额不足)
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                isFuture ? (
                                                    <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                        <Calendar size={16} />
                                                        计划休假
                                                    </span>
                                                ) : (
                                                    <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                                        <CheckCircle2 size={16} />
                                                        带薪年假
                                                    </span>
                                                )
                                            )
                                        ) : record.type === 'special' ? (
                                            <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                                <Calendar size={16} />
                                                特休
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <HelpCircle size={16} />
                                                其他假期
                                            </span>
                                        )}

                                        {isDeficit ? (
                                            <div className="flex gap-2">
                                                 <span className="bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                                    -{record.deficitDays} 天 (扣款)
                                                 </span>
                                                 {isPartial && (
                                                     <span className="bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-400 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                                        {record.days - record.deficitDays} 天 (带薪)
                                                     </span>
                                                 )}
                                            </div>
                                        ) : (
                                            <span className={`border text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                                isFuture 
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                                                : 'bg-teal-50 dark:bg-teal-900/30 border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-400'
                                            }`}>
                                                {record.days} 天
                                            </span>
                                        )}
                                    </div>
                                    {record.note ? (
                                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{record.note}</div>
                                    ) : (
                                        <div className="text-sm text-slate-400 dark:text-slate-600 italic mt-1">无备注</div>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => onDeleteRecord(record.id)}
                                className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors opacity-0 group-hover:opacity-100"
                                title="删除记录"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* Add Leave Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">登记休假</h3>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">日期</label>
                <input 
                  type="date" 
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">天数</label>
                <select 
                  value={newDays}
                  onChange={e => setNewDays(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all appearance-none"
                >
                    <option value={1}>1 天 (全天)</option>
                    <option value={0.5}>0.5 天 (半天)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">类型</label>
                <select 
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all appearance-none"
                >
                    <option value="paid">年假</option>
                    <option value="special">特休</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">备注</label>
                <textarea 
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  required={newType === 'special'}
                  className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all ${
                    newType === 'special' && !newNote 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' 
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  rows={3}
                  placeholder={newType === 'special' ? "特休理由 (必填)" : "例如：私事，看病..."}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors">取消</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium transition-colors shadow-lg shadow-teal-600/20">确认登记</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Baseline Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">设置余额基准</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                用于历史数据迁移。系统将以您设定的天数为起始余额。
              </p>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-6 space-y-5">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex gap-3 text-amber-800 dark:text-amber-400 text-sm mb-2 border border-amber-200 dark:border-amber-800/50">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p>如果不确定，请留空。留空则系统完全根据入职日期自动计算所有历史假额。</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">基准日期 (截止日)</label>
                <input 
                  type="date" 
                  value={editBaselineDate}
                  onChange={e => setEditBaselineDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">该日剩余天数</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={editBaselineDays}
                  onChange={e => setEditBaselineDays(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition-all"
                  placeholder="例如: 12.5"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setEditBaselineDate('');
                    setEditBaselineDays('');
                  }} 
                  className="px-4 py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
                >
                  清空基准
                </button>
                <div className="flex-1"></div>
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors">取消</button>
                <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium transition-colors shadow-lg shadow-teal-600/20">保存设置</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
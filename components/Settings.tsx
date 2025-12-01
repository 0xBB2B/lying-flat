import React from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { Employee, LeaveRecord } from '../types';

interface SettingsProps {
  employees: Employee[];
  records: LeaveRecord[];
  onImport: (data: { employees: Employee[], records: LeaveRecord[] }) => void;
  onClear: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ employees, records, onImport, onClear }) => {
  
  const handleExport = () => {
    const data = {
      employees,
      records,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `japan_leave_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        console.log("Reading file content...");
        
        const json = JSON.parse(fileContent);
        
        const hasEmployees = json.employees && Array.isArray(json.employees);
        const hasRecords = json.records && Array.isArray(json.records);
        
        if (hasEmployees && hasRecords) {
          console.log(`Valid JSON: ${json.employees.length} employees, ${json.records.length} records.`);
          if (window.confirm(`确认导入 ${json.employees.length} 名员工和 ${json.records.length} 条记录? \n当前数据将被覆盖。`)) {
            onImport({ employees: json.employees, records: json.records });
          }
        } else {
          console.error("Invalid JSON structure", json);
          alert("文件格式不正确：缺少 employees 或 records 数组。请确保上传的是本系统导出的 JSON 文件。");
        }
      } catch (error) {
        console.error("JSON Parse Error:", error);
        alert("无法解析 JSON 文件，请检查文件是否损坏。");
      }
    };
    
    reader.onerror = () => {
        console.error("File Reader Error", reader.error);
        alert("读取文件时发生错误");
    };
    
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">设置与数据管理</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">导入或导出系统数据，数据安全地存储在您的浏览器中。</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">数据备份</h3>
        </div>
        <div className="p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="bg-teal-50 dark:bg-teal-900/30 p-4 rounded-2xl text-teal-600 dark:text-teal-400 flex-shrink-0">
              <Download size={28} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">导出数据</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                下载 JSON 格式的备份文件。建议定期备份，以防浏览器缓存被清除导致数据丢失。
              </p>
              <button onClick={handleExport} className="px-5 py-2.5 bg-slate-800 dark:bg-teal-600 text-white rounded-xl hover:bg-slate-900 dark:hover:bg-teal-700 text-sm font-medium transition-all shadow-md">
                下载备份文件
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-700"></div>

          <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Upload size={28} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">恢复数据</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                使用之前导出的 JSON 文件恢复数据。注意：这将覆盖当前的所有数据。
              </p>
              <label className="cursor-pointer inline-flex items-center justify-center px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-all relative">
                <span>选择备份文件</span>
                <input type="file" accept=".json" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
          <h3 className="font-bold text-lg text-red-800 dark:text-red-400 flex items-center gap-2">
            <Trash2 size={20} />
            危险区域
          </h3>
        </div>
        <div className="p-8">
          <h4 className="font-bold text-slate-800 dark:text-white mb-2">清除所有数据</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            此操作将从浏览器本地存储中<span className="font-bold text-red-600 dark:text-red-400">永久删除</span>所有员工信息和休假记录。此操作不可撤销。
          </p>
          <button 
            onClick={() => { if(window.confirm('确定要清空所有数据吗？此操作不可恢复。')) onClear(); }}
            className="px-5 py-2.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-all"
          >
            清空数据库
          </button>
        </div>
      </div>
    </div>
  );
};
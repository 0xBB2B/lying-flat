import React from 'react';
import { Plane, Users, Settings, Moon, Sun, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'employees' | 'settings';
  setActiveTab: (tab: 'employees' | 'settings') => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  isDarkMode, 
  toggleTheme 
}) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 z-20 transition-colors duration-300 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
          <div className="bg-teal-50 dark:bg-teal-900/30 p-2 rounded-xl">
            <Plane className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">JapanLeave</span>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">主菜单</div>
          <button
            onClick={() => setActiveTab('employees')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${
              activeTab === 'employees' 
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users size={20} />
            <span>员工管理</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${
              activeTab === 'settings' 
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Settings size={20} />
            <span>数据与设置</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
           <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
             <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300">合规提示</p>
             本系统计算逻辑基于日本劳动基准法 (第39条)。请假记录保存期限建议为3年。
           </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-2">
            <Plane className="h-6 w-6 text-teal-600" />
            <span className="font-bold text-slate-800 dark:text-white">JapanLeave</span>
        </div>
        <button className="text-slate-500">
            <Menu size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-8 z-10 sticky top-0">
          <div className="flex items-center text-sm breadcrumbs text-slate-500 dark:text-slate-400">
            <span>首页</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
                {activeTab === 'employees' ? '员工列表' : '系统设置'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Toggle Dark Mode"
            >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-teal-500/30">
                AD
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};
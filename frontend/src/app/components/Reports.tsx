import { useState, useEffect } from 'react';
import { getReportStats, getRecentReports } from '../../services/reportService';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Download, 
  Calendar,
  Filter,
  FileText,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';

// Fallback data in case API is unreachable
const fallbackStats = { GrowthRate: 0, Efficiency: 0, ActiveUsers: 0, Deliverables: 0, TotalProjects: 0, ActiveProjects: 0, CompletedProjects: 0, TotalTasks: 0, CompletedTasks: 0, OverdueTasks: 0, TotalHoursLogged: 0, TotalBudget: 0, TotalSpent: 0, TeamSize: 0 };
const fallbackReports: any[] = [];

export default function Reports() {
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState('project');
  const [stats, setStats] = useState<any>(fallbackStats);
  const [reports, setReports] = useState<any[]>(fallbackReports);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsData, reportsData] = await Promise.all([
          getReportStats(),
          getRecentReports()
        ]);
        setStats(statsData);
        setReports(reportsData);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
        setStats(fallbackStats);
        setReports(fallbackReports);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = () => {
    window.print();
  };

  const handleFilter = () => {
    // In a real app, this would open a date picker or category filter
    alert('Filter functionality: You can filter by Date Range or Project Category in the production version.');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">System Reports</h2>
          <p className="text-gray-600">Advanced analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleFilter}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          {JSON.parse(localStorage.getItem('user_info') || '{}').role !== 'Client' && (
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-100"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Now from real API data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${stats.GrowthRate >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              {stats.GrowthRate >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(stats.GrowthRate)}%
            </span>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Growth Rate</div>
          <div className="text-2xl font-bold text-gray-900">{stats.GrowthRate >= 0 ? '+' : ''}{stats.GrowthRate}%</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${stats.Efficiency >= 80 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              {stats.Efficiency >= 80 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {stats.Efficiency}%
            </span>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Efficiency</div>
          <div className="text-2xl font-bold text-gray-900">{stats.Efficiency}%</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3" />
              Active
            </span>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Active Users</div>
          <div className="text-2xl font-bold text-gray-900">{stats.ActiveUsers} / {stats.TeamSize}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-teal-50 rounded-lg">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3" />
              {stats.Deliverables}
            </span>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Deliverables</div>
          <div className="text-2xl font-bold text-gray-900">{stats.Deliverables}</div>
        </div>
      </div>

      {/* Summary Metrics - Also from real data */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.TotalProjects}</div>
          <div className="text-xs text-gray-500 font-medium">Total Projects</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.ActiveProjects}</div>
          <div className="text-xs text-gray-500 font-medium">Active</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.CompletedTasks}</div>
          <div className="text-xs text-gray-500 font-medium">Tasks Done</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.OverdueTasks}</div>
          <div className="text-xs text-gray-500 font-medium">Overdue</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.TotalHoursLogged?.toFixed(0) || 0}</div>
          <div className="text-xs text-gray-500 font-medium">Hours Logged</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-emerald-600">${((stats.TotalBudget || 0) / 1000).toFixed(0)}k</div>
          <div className="text-xs text-gray-500 font-medium">Total Budget</div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              {reportType === 'project' ? 'Project Performance' : reportType === 'team' ? 'Team Utilization' : 'Company Overview'}
            </h3>
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="text-xs font-bold text-gray-500 bg-gray-50 border-none rounded-lg px-3 py-2 outline-none cursor-pointer print:hidden"
            >
              <option value="project">By Project</option>
              <option value="team">By Team</option>
              <option value="company">By Company</option>
            </select>
          </div>
          
          {/* Dynamic Visualization based on reportType */}
          <div className="space-y-4">
            {reportType === 'project' ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Budget Utilization</span>
                  <span className="font-bold text-gray-900">{stats.TotalBudget > 0 ? ((stats.TotalSpent / stats.TotalBudget) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-4 rounded-full transition-all duration-500" style={{ width: `${stats.TotalBudget > 0 ? Math.min(100, (stats.TotalSpent / stats.TotalBudget) * 100) : 0}%` }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Spent: ${((stats.TotalSpent || 0) / 1000).toFixed(0)}k</span>
                  <span>Budget: ${((stats.TotalBudget || 0) / 1000).toFixed(0)}k</span>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Overall Task Completion</span>
                    <span className="font-bold text-gray-900">{stats.TotalTasks > 0 ? ((stats.CompletedTasks / stats.TotalTasks) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500" style={{ width: `${stats.TotalTasks > 0 ? (stats.CompletedTasks / stats.TotalTasks) * 100 : 0}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Completed: {stats.CompletedTasks}</span>
                    <span>Remaining: {stats.TotalTasks - stats.CompletedTasks}</span>
                  </div>
                </div>
              </>
            ) : reportType === 'team' ? (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-blue-900">Total Hours Tracked</span>
                    <span className="text-xl font-black text-blue-600">{stats.TotalHoursLogged?.toFixed(1)} hrs</span>
                  </div>
                  <p className="text-xs text-blue-700">Across {stats.TeamSize} team members this period.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Resource Efficiency</span>
                    <span className="font-bold text-gray-900">{stats.Efficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${stats.Efficiency}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                    <div className="text-xs font-bold text-teal-700 uppercase mb-1">Growth</div>
                    <div className="text-2xl font-black text-teal-600">{stats.GrowthRate}%</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="text-xs font-bold text-purple-700 uppercase mb-1">Active Projects</div>
                    <div className="text-2xl font-black text-purple-600">{stats.ActiveProjects}</div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="text-sm font-bold text-gray-900 mb-2">Project Success Rate</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${(stats.CompletedProjects / (stats.TotalProjects || 1)) * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">{((stats.CompletedProjects / (stats.TotalProjects || 1)) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center h-32 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30 print:hidden">
              <div className="text-center">
                <PieChart className="w-8 h-8 text-gray-200 mx-auto mb-1" />
                <p className="text-xs text-gray-400 font-medium italic">Interactive charts would render here in Production</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print:border-none">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Recent Generated Reports
          </h3>
          <div className="space-y-4">
            {reports.length > 0 ? reports.map((report: any) => (
              <div key={report.Id || report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{report.Name || report.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{report.GeneratedDate || report.generatedDate}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{report.Summary || report.summary}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-600">{report.Size || report.size}</div>
                  <div className="text-[10px] font-black text-orange-500 uppercase">{report.Type || report.type}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No reports generated yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import StatsCards from "@/components/stats-cards";
import RecentSubmissions from "@/components/recent-submissions";
import Leaderboard from "@/components/leaderboard";
import SystemStatus from "@/components/system-status";

export default function Dashboard() {
  const { data: currentWordle, isLoading: wordleLoading } = useQuery({
    queryKey: ['/api/wordle/current'],
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: systemStatus } = useQuery({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button className="md:hidden -ml-2 mr-2 h-6 w-6 text-gray-600">
                  <i className="fas fa-bars"></i>
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Wordle Status */}
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                  <i className="fas fa-calendar-day text-primary mr-2"></i>
                  <span className="text-sm font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">•</span>
                  <span className="ml-2 text-sm font-mono font-semibold" data-testid="wordle-solution">
                    {wordleLoading ? 'Loading...' : currentWordle?.solution || 'N/A'}
                  </span>
                </div>
                {/* Bot Status */}
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-discord rounded-full flex items-center justify-center">
                    <i className="fab fa-discord text-white text-sm"></i>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700" data-testid="bot-status">
                    {systemStatus?.discordBot?.status || 'Unknown'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ml-2 ${
                    systemStatus?.discordBot?.status === 'Online' ? 'bg-accent' : 'bg-red-500'
                  }`}></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <StatsCards />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RecentSubmissions />
                <Leaderboard />
              </div>

              <SystemStatus />

              {/* Quick Actions */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button 
                      className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      data-testid="button-start-event"
                    >
                      <i className="fas fa-play mr-2"></i>
                      Start New Event
                    </button>
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      data-testid="button-export-data"
                    >
                      <i className="fas fa-download mr-2"></i>
                      Export Data
                    </button>
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      data-testid="button-reset-scores"
                    >
                      <i className="fas fa-refresh mr-2"></i>
                      Reset Scores
                    </button>
                    <button 
                      className="bg-warning hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      data-testid="button-force-sync"
                    >
                      <i className="fas fa-sync mr-2"></i>
                      Force Sync
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

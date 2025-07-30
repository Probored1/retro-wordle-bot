import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-primary';
      case 2: return 'bg-gray-400';
      case 3: return 'bg-warning';
      default: return 'bg-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {leaderboard?.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No participants yet
            </div>
          ) : (
            leaderboard?.map((user: any, index: number) => {
              const rank = index + 1;
              return (
                <div 
                  key={user.id} 
                  className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50"
                  data-testid={`leaderboard-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 ${getRankColor(rank)} rounded-full flex items-center justify-center`}>
                        <span className="text-sm font-medium text-white" data-testid={`rank-${index}`}>
                          {rank}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900" data-testid={`player-name-${index}`}>
                          {user.username}
                        </p>
                        <p className="text-sm text-gray-500" data-testid={`player-status-${index}`}>
                          {user.prizeEligible ? '🏆 Prize Eligible' : `${user.score}/30 to prize`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900" data-testid={`player-score-${index}`}>
                        {user.score} points
                      </p>
                      <p className="text-xs text-gray-500" data-testid={`player-streak-${index}`}>
                        {user.successfulSubmissions || 0} submissions
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {leaderboard?.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <Button variant="ghost" size="sm" className="text-primary hover:text-blue-800 p-0" data-testid="button-view-full-leaderboard">
              View full leaderboard →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Participants',
      value: stats?.totalParticipants || 0,
      icon: 'fas fa-users',
      color: 'text-primary',
      testId: 'stat-participants'
    },
    {
      title: 'Today\'s Submissions',
      value: stats?.todaySubmissions || 0,
      icon: 'fas fa-check-circle',
      color: 'text-accent',
      testId: 'stat-submissions'
    },
    {
      title: 'Prize Eligible',
      value: stats?.prizeEligible || 0,
      icon: 'fas fa-trophy',
      color: 'text-warning',
      testId: 'stat-eligible'
    },
    {
      title: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      icon: 'fas fa-percentage',
      color: 'text-secondary',
      testId: 'stat-success-rate'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {statsData.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className={`${stat.icon} text-2xl ${stat.color}`}></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                  <dd className="text-2xl font-semibold text-gray-900" data-testid={stat.testId}>
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

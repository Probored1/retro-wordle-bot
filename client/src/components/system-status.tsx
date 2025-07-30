import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemStatus() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const services = [
    {
      name: 'Discord Bot',
      status: status?.discordBot?.status || 'Unknown',
      icon: 'fab fa-discord',
      latency: status?.discordBot?.latency || 'N/A',
      testId: 'discord-bot'
    },
    {
      name: 'RetroAchievements API',
      status: status?.retroAchievements?.status || 'Unknown',
      icon: 'fas fa-trophy',
      latency: status?.retroAchievements?.responseTime || 'N/A',
      testId: 'retro-api'
    },
    {
      name: 'Database',
      status: status?.database?.status || 'Unknown',
      icon: 'fas fa-database',
      latency: status?.database?.connections || 'N/A',
      testId: 'database'
    }
  ];

  const getStatusColor = (serviceStatus: string) => {
    switch (serviceStatus.toLowerCase()) {
      case 'online':
      case 'healthy':
      case 'connected':
        return 'bg-accent text-accent';
      case 'offline':
      case 'error':
      case 'disconnected':
        return 'bg-error text-error';
      default:
        return 'bg-warning text-warning';
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => {
            const colorClass = getStatusColor(service.status);
            return (
              <div key={service.name} className="text-center" data-testid={`service-${service.testId}`}>
                <div className={`inline-flex items-center justify-center w-12 h-12 ${colorClass.split(' ')[0]} rounded-full mb-3`}>
                  <i className={`${service.icon} text-white text-xl`}></i>
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">{service.name}</h4>
                <p className={`text-sm font-medium ${colorClass.split(' ')[1]}`} data-testid={`status-${service.testId}`}>
                  {service.status}
                </p>
                <p className="text-xs text-gray-500 mt-1" data-testid={`latency-${service.testId}`}>
                  {service.latency}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

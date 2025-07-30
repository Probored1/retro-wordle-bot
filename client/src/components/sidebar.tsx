import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'fas fa-chart-line', current: location === '/' },
    { name: 'Participants', href: '/participants', icon: 'fas fa-users', current: location === '/participants' },
    { name: 'Leaderboard', href: '/leaderboard', icon: 'fas fa-trophy', current: location === '/leaderboard' },
    { name: 'Submissions', href: '/submissions', icon: 'fas fa-list-check', current: location === '/submissions' },
    { name: 'Configuration', href: '/config', icon: 'fas fa-cog', current: location === '/config' },
    { name: 'Bot Status', href: '/status', icon: 'fas fa-server', current: location === '/status' },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-4">
          <i className="fas fa-trophy text-2xl text-primary mr-3"></i>
          <span className="text-xl font-semibold text-gray-900" data-testid="app-title">Wordle Bot</span>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  item.current
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <i className={`${item.icon} mr-3 text-sm`}></i>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

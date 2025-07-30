import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RecentSubmissions() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['/api/submissions/recent'],
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {submissions?.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No submissions yet today
            </div>
          ) : (
            submissions?.map((submission: any, index: number) => (
              <div 
                key={submission.id} 
                className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50"
                data-testid={`submission-${index}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {submission.user?.username?.slice(0, 2).toUpperCase() || 'UN'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900" data-testid={`username-${index}`}>
                        {submission.user?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 font-mono" data-testid={`letters-${index}`}>
                        {submission.wordleSolution?.split('').join('-') || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.isValid 
                        ? 'bg-accent text-white' 
                        : 'bg-error text-white'
                    }`} data-testid={`status-${index}`}>
                      <i className={`${submission.isValid ? 'fas fa-check' : 'fas fa-times'} mr-1`}></i>
                      {submission.isValid ? 'Valid' : 'Invalid'}
                    </span>
                    <span className="ml-2 text-xs text-gray-500" data-testid={`time-${index}`}>
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {submissions?.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <Button variant="ghost" size="sm" className="text-primary hover:text-blue-800 p-0" data-testid="button-view-all-submissions">
              View all submissions →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

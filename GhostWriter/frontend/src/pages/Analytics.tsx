import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, TrendingDown, Activity, Shield, Code, 
  Database, Cloud, Package, GitBranch, Users, 
  Calendar, BarChart3, PieChart, LineChart, RefreshCw
} from 'lucide-react';

interface HealthMetrics {
  avg_maintainability: number;
  avg_complexity: number;
  avg_security: number;
  avg_comments: number;
  total_files: number;
  total_lines: number;
}

interface TechStack {
  language: string;
  framework: string;
  file_count: number;
  all_libraries: string;
}

interface EvolutionData {
  date: string;
  lines_added: number;
  lines_deleted: number;
  commits: number;
  avg_complexity_change: number;
}

interface ProjectAnalytics {
  healthMetrics: HealthMetrics;
  techStack: TechStack[];
  evolution: EvolutionData[];
  overallHealthScore: number;
}

function Analytics() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadAnalytics();
    }
  }, [selectedProject, timeRange]);

  const loadProjects = async () => {
    try {
      const response = await window.electronAPI.getProjects();
      if (response.success) {
        const projectNames = response.data.map((p: any) => p.name);
        setProjects(projectNames);
        if (projectNames.length > 0) {
          setSelectedProject(projectNames[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.getProjectAnalytics({
        projectName: selectedProject,
        days: timeRange
      });
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (score >= 60) return <Activity className="h-5 w-5 text-yellow-500" />;
    return <TrendingDown className="h-5 w-5 text-red-500" />;
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (!analytics) {
    return (
      <div className="h-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a project to view analytics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">📊 Analytics Dashboard</h1>
          <p className="text-gray-300 mt-2">Comprehensive insights into your codebase health and evolution</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2"
          >
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          
          <Button onClick={loadAnalytics} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            {getHealthIcon(analytics.overallHealthScore)}
            Overall Health Score
            <span className="text-sm font-normal text-gray-400">
              ({getHealthStatus(analytics.overallHealthScore)})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-center mb-4">
            <span className={getHealthColor(analytics.overallHealthScore)}>
              {analytics.overallHealthScore.toFixed(1)}
            </span>
            <span className="text-gray-400 text-2xl">/100</span>
          </div>
          
          {/* Health Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {analytics.healthMetrics.avg_maintainability?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Maintainability</div>
            </div>
            <div className="text-center p-3 bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-500">
                {analytics.healthMetrics.avg_complexity?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Complexity</div>
            </div>
            <div className="text-center p-3 bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {analytics.healthMetrics.avg_security?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Security</div>
            </div>
            <div className="text-center p-3 bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">
                {(analytics.healthMetrics.avg_comments * 100)?.toFixed(1) || 'N/A'}%
              </div>
              <div className="text-sm text-gray-400">Comments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Code Metrics */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Code className="h-5 w-5 text-blue-500" />
              Code Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Total Files</span>
              <span className="font-semibold text-gray-100">
                {analytics.healthMetrics.total_files?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Lines of Code</span>
              <span className="font-semibold text-gray-100">
                {analytics.healthMetrics.total_lines?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Avg Complexity</span>
              <span className="font-semibold text-gray-100">
                {analytics.healthMetrics.avg_complexity?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Comment Ratio</span>
              <span className="font-semibold text-gray-100">
                {((analytics.healthMetrics.avg_comments || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Package className="h-5 w-5 text-green-500" />
              Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.techStack.slice(0, 5).map((tech, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
                <div>
                  <div className="font-semibold text-gray-100">{tech.language}</div>
                  {tech.framework && (
                    <div className="text-sm text-gray-400">{tech.framework}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-100">{tech.file_count}</div>
                  <div className="text-sm text-gray-400">files</div>
                </div>
              </div>
            ))}
            {analytics.techStack.length === 0 && (
              <div className="text-center text-gray-400 py-4">
                No technology data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolution Trends */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <LineChart className="h-5 w-5 text-purple-500" />
              Evolution Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.evolution.slice(-5).map((trend, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
                <div>
                  <div className="font-semibold text-gray-100">{trend.date}</div>
                  <div className="text-sm text-gray-400">{trend.commits} commits</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-500">+{trend.lines_added}</div>
                  <div className="text-sm text-red-500">-{trend.lines_deleted}</div>
                </div>
              </div>
            ))}
            {analytics.evolution.length === 0 && (
              <div className="text-center text-gray-400 py-4">
                No evolution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution Chart */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Code Evolution Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <LineChart className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Using Chart.js or Recharts</p>
                <div className="mt-4 text-xs">
                  <div>Lines Added: {analytics.evolution.reduce((sum, e) => sum + e.lines_added, 0)}</div>
                  <div>Lines Deleted: {analytics.evolution.reduce((sum, e) => sum + e.lines_deleted, 0)}</div>
                  <div>Total Commits: {analytics.evolution.reduce((sum, e) => sum + e.commits, 0)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack Distribution */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Technology Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto mb-2" />
                <p>Pie chart visualization would go here</p>
                <p className="text-sm">Showing language/framework distribution</p>
                <div className="mt-4 text-xs">
                  <div>Languages: {analytics.techStack.length}</div>
                  <div>Frameworks: {analytics.techStack.filter(t => t.framework).length}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">AI-Powered Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.overallHealthScore < 70 && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <Shield className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-400">Code Health Alert</div>
                  <div className="text-sm text-gray-300">
                    Your codebase health score is below 70. Consider refactoring complex functions and improving documentation.
                  </div>
                </div>
              </div>
            )}
            
            {analytics.healthMetrics.avg_complexity > 10 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <Code className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-400">High Complexity Detected</div>
                  <div className="text-sm text-gray-300">
                    Average cyclomatic complexity is high. Consider breaking down complex functions into smaller, more manageable pieces.
                  </div>
                </div>
              </div>
            )}
            
            {analytics.healthMetrics.avg_security < 80 && (
              <div className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <Shield className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-orange-400">Security Concerns</div>
                  <div className="text-sm text-gray-300">
                    Security score is below 80. Review code for potential vulnerabilities and security best practices.
                  </div>
                </div>
              </div>
            )}

            {analytics.healthMetrics.avg_comments < 0.1 && (
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Code className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-400">Documentation Needed</div>
                  <div className="text-sm text-gray-300">
                    Comment ratio is low. Consider adding more comments and documentation to improve code maintainability.
                  </div>
                </div>
              </div>
            )}

            {analytics.evolution.length > 0 && analytics.evolution[analytics.evolution.length - 1].lines_added > 500 && (
              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-400">Active Development</div>
                  <div className="text-sm text-gray-300">
                    High activity detected! Your project is actively being developed with significant code additions.
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Analytics;

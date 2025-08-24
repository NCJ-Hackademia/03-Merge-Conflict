import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, FileText, Users, Calendar } from 'lucide-react';

interface Project {
  name: string;
  documents: number;
  last_updated: string;
  authors: string[];
}

function Explore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await window.electronAPI.getProjects();
      if (response.success) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const handleProjectSelect = (projectName: string) => {
    navigate('/chat', { state: { selectedProject: projectName } });
  };

  return (
    <div className="h-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-100">
          📁 Project Explorer
        </h1>
        <p className="text-gray-300 mt-2">Browse and explore your tracked projects</p>
      </div>

      {/* Projects Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-100">{projects.length}</div>
            <p className="text-sm text-gray-300">Projects Tracked</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-100">
              {projects.reduce((sum, p) => sum + p.documents, 0)}
            </div>
            <p className="text-sm text-gray-300">Total Documents</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-100">
              {[...new Set(projects.flatMap(p => p.authors))].length}
            </div>
            <p className="text-sm text-gray-300">Unique Contributors</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <Card key={project.name} className="shadow-sm bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2 text-gray-100">
                      <FolderOpen className="h-5 w-5 text-blue-500" />
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {project.documents} documents
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {project.authors.length} contributors
                      </span>
                      {project.last_updated && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Updated {project.last_updated}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleProjectSelect(project.name)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Search This Project
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-200">Contributors:</div>
                  <div className="flex flex-wrap gap-2">
                    {project.authors.map((author) => (
                      <span key={author} className="bg-gray-600 text-gray-200 px-3 py-1 rounded-full text-sm">
                        👤 {author}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Card className="shadow-sm bg-gray-800/50 border-gray-700 max-w-md mx-auto">
            <CardContent className="pt-6">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="text-lg font-medium text-gray-100 mb-2">No Projects Yet</CardTitle>
              <p className="text-gray-300 mb-6">
                Use the GhostWriter CLI in your git repositories to start tracking and ingesting your code.
              </p>

              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-gray-200">Quick Setup:</h4>
                <div className="text-sm text-left space-y-1">
                  <code className="block bg-gray-600 text-gray-100 p-1 rounded">cd your-project</code>
                  <code className="block bg-gray-600 text-gray-100 p-1 rounded">gw start</code>
                  <code className="block bg-gray-600 text-gray-100 p-1 rounded">git commit -m "your changes"</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Explore;

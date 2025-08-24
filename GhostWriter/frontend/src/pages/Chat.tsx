import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Search, FileText, Users, Calendar, Target, FolderOpen, GitBranch, Loader2, MessageCircle, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

interface QueryResult {
  query: string;
  answer: string;
  project?: string;
  sources: Array<{
    file_path: string;
    author: string;
    commit_message: string;
    commit_date: string;
    relevance_score: string;
    preview: string;
  }>;
}

interface Project {
  name: string;
  documents: number;
  last_updated: string;
  authors: string[];
}

interface CodePreviewProps {
  code: string;
  filename: string;
  language?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, filename, language }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const lines = code.split('\n');

  const defaultLines = 8;
  const expandedLines = 25;
  const displayLines = isExpanded
    ? lines.slice(0, Math.min(expandedLines, lines.length))
    : lines.slice(0, Math.min(defaultLines, lines.length));

  const hasMore = lines.length > defaultLines;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getLanguageFromExtension = (filename: string) => {
    const ext = getFileExtension(filename);
    const langMap: { [key: string]: string } = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown',
      'yml': 'yaml', 'yaml': 'yaml', 'xml': 'xml', 'sql': 'sql', 'sh': 'bash'
    };
    return langMap[ext] || 'text';
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700">
      {/* Code header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm text-gray-300 font-mono">{filename}</span>
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
            {getLanguageFromExtension(filename)}
          </span>
          <span className="text-xs text-gray-400">{lines.length} lines</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
          >
            {showLineNumbers ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            Lines
          </button>
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {isExpanded ? `Show ${defaultLines}` : `Show ${Math.min(expandedLines, lines.length)} lines`}
            </button>
          )}
        </div>
      </div>

      {/* Code content */}
      <div className="relative">
        <pre className="p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto">
          <code className="text-gray-100 font-mono">
            {displayLines.map((line, index) => (
              <div key={index} className="flex hover:bg-gray-800/30 px-1 -mx-1 rounded min-h-[1.2rem]">
                {showLineNumbers && (
                  <span className="text-gray-500 select-none mr-4 text-right w-10 flex-shrink-0 leading-5">
                    {index + 1}
                  </span>
                )}
                <span className="flex-1 whitespace-pre-wrap leading-5">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>

        {!isExpanded && hasMore && (
          <div className="border-t border-gray-700 px-4 py-3 text-center bg-gray-800/30">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              Show {lines.length - defaultLines} more lines ({lines.length} total)
            </button>
          </div>
        )}

        {isExpanded && lines.length > expandedLines && (
          <div className="border-t border-gray-700 px-4 py-2 text-center bg-gray-800/30">
            <span className="text-xs text-gray-400">
              Showing first {expandedLines} of {lines.length} lines
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

function Chat() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (location.state && location.state.selectedProject) {
      setSelectedProject(location.state.selectedProject);
    }
  }, [location.state]);

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

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        query: query.trim(),
        k: 10,
        projectName: selectedProject === 'all' ? null : selectedProject
      };

      const response = await window.electronAPI.searchRAG(searchParams);

      if (response.success) {
        const filteredSources = response.data.sources?.filter((source: any) => {
          const score = parseFloat(source.relevance_score.replace('%', ''));
          return score > 40;
        }) || [];

        setResult({
          ...response.data,
          sources: filteredSources
        });
      } else {
        setError(response.error || 'Query failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-100">
          💬 GhostWriter Chat
        </h1>

        <button
          onClick={() => navigate('/explore')}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors bg-gray-600 text-white hover:bg-gray-700"
        >
          <FolderOpen className="h-4 w-4" />
          Browse Projects ({projects.length})
        </button>
      </div>

      {/* Enhanced Query Input with Project Filter */}
      <div className="mb-6 space-y-4">
        {/* Project Filter */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Search Scope
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
            >
              <option value="all">🌐 All Projects ({projects.reduce((sum, p) => sum + p.documents, 0)} docs)</option>
              {projects.map((project) => (
                <option key={project.name} value={project.name}>
                  📁 {project.name} ({project.documents} docs)
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-300 bg-gray-800/50 border border-gray-700 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span>{projects.length} projects tracked</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{projects.reduce((sum, p) => sum + p.documents, 0)} total documents</span>
            </div>
          </div>
        </div>

        {/* Query Input */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Ask about your code
          </label>
          <div className="flex gap-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your code... (e.g., 'How does user authentication work?', 'Show me all API endpoints')"
              className="flex-1 px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 placeholder-gray-400 resize-none"
              rows={3}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleQuery}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-600 flex items-center gap-2 h-fit transition-all"
            >
              {loading ? (
                <>
                  <div className="relative">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <div className="absolute inset-0 h-4 w-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className="animate-pulse">Thinking...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Ask AI
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Press Enter to search • Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mb-6 bg-gray-800/50 border border-gray-700 rounded-lg p-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="relative">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 h-8 w-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin animation-delay-150"></div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-200 font-medium">AI is analyzing your code...</div>
              <div className="text-gray-400 text-sm animate-pulse">
                {selectedProject === 'all'
                  ? `Searching across ${projects.reduce((sum, p) => sum + p.documents, 0)} documents`
                  : `Searching in ${selectedProject} project`
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-600 text-red-300 rounded-lg flex items-center gap-2">
          <span>❌</span>
          {error}
        </div>
      )}

      {/* Enhanced Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* ✅ IMPROVED: Better AI Answer formatting */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-100"> AI Answer</h3>
              {result.project && (
                <span className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-sm">
                  📁 {result.project}
                </span>
              )}
            </div>
            {/* ✅ IMPROVED: Better prose styling for markdown */}
            <div className="prose prose-invert prose-slate max-w-none">
              <div className="text-gray-100 leading-relaxed space-y-4">
                <ReactMarkdown
                  components={{
                    // ✅ Better heading styles
                    h1: ({ children }) => <h1 className="text-xl font-bold text-gray-100 mb-4 mt-6">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-100 mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-medium text-gray-100 mb-2 mt-4">{children}</h3>,

                    // ✅ Better paragraph spacing
                    p: ({ children }) => <p className="text-gray-100 leading-relaxed mb-4">{children}</p>,

                    // ✅ Better list styling
                    ul: ({ children }) => <ul className="text-gray-100 space-y-1 mb-4 pl-6 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="text-gray-100 space-y-1 mb-4 pl-6 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-100">{children}</li>,

                    // ✅ Better code styling
                    code: ({ children }) => (
                      <code className="bg-gray-700 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto mb-4">
                        {children}
                      </pre>
                    ),

                    // ✅ Better blockquote styling
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 mb-4">
                        {children}
                      </blockquote>
                    ),

                    // ✅ Better strong/em styling
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-200">{children}</em>
                  }}
                >
                  {result.answer}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Enhanced Source Files */}
          {result.sources && result.sources.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-100">
                  Relevant Source Files ({result.sources.length})
                </h3>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  Showing files with &gt;40% relevance
                </span>
              </div>

              <div className="space-y-6">
                {result.sources.map((source, idx) => (
                  <div key={idx} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                    {/* File Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <code className="bg-gray-600 text-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {source.file_path}
                          </code>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {source.author || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {source.commit_date}
                          </span>
                          <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs font-medium">
                            🎯 {source.relevance_score} relevance
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Commit Info */}
                    <div className="mb-4 p-3 bg-gray-600/50 border border-gray-600 rounded">
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <GitBranch className="h-3 w-3" />
                        <span className="font-medium">Commit:</span>
                        <span className="italic">{source.commit_message}</span>
                      </div>
                    </div>

                    {/* Enhanced Code Preview */}
                    <CodePreview
                      code={source.preview}
                      filename={source.file_path.split('/').pop() || 'unknown'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Relevant Sources Message */}
          {result.sources && result.sources.length === 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-gray-400 mb-2">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <h3 className="font-medium text-gray-300">No Highly Relevant Source Files</h3>
                <p className="text-sm mt-1">
                  The AI answered based on general knowledge. Try asking about specific code files or functions in your project.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;

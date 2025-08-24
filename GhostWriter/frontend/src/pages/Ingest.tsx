
import { useState } from 'react';

function Ingest() {
  const [text, setText] = useState('');
  const [filePath, setFilePath] = useState('');
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Bulk ingest state
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleIngest = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    const metadata = {
      file_path: filePath || 'unknown',
      author: author || 'Anonymous',
      date: new Date().toISOString(),
      message: message || 'Manual ingestion'
    };

    try {
      const response = await window.electronAPI.ingestDocument(text, metadata);

      if (response.success) {
        setResult(response.data);
        // Clear form
        setText('');
        setFilePath('');
        setMessage('');
      } else {
        setError(response.error || 'Ingestion failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkIngest = async () => {
    setBulkLoading(true);
    setError(null);

    try {
      const response = await window.electronAPI.bulkIngest(bulkCount);

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Bulk ingestion failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBulkLoading(false);
    }
  };

  const fillSampleCode = () => {
    setText(`// auth.js
function verifyToken(token) {
  if (!token) {
    throw new Error("Token is required");
  }
  
  // TODO: Implement JWT verification
  return { valid: true, user: 'demo' };
}

module.exports = { verifyToken };`);
    setFilePath('src/auth/auth.js');
    setAuthor('Demo User');
    setMessage('Add token verification with JWT todo');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-100">📥 Document Ingestion</h1>

      {/* Manual Ingestion Form */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Manual Document Upload</h2>

        <div className="space-y-4">
          {/* Code/Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Code/Text Content *
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your code or text here..."
              className="w-full h-48 px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 placeholder-gray-400"
            />
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                File Path
              </label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="src/components/Button.js"
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Commit Message
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add new authentication function"
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 placeholder-gray-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleIngest}
              disabled={loading || !text.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-600"
            >
              {loading ? '🔄 Ingesting...' : '📥 Ingest Document'}
            </button>

            <button
              onClick={fillSampleCode}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              🎯 Fill Sample Code
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Ingestion */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Bulk Demo Ingestion</h2>
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={bulkCount}
            onChange={(e) => setBulkCount(parseInt(e.target.value) || 10)}
            min="1"
            max="100"
            className="w-24 px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
          />
          <button
            onClick={handleBulkIngest}
            disabled={bulkLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-600"
          >
            {bulkLoading ? '🔄 Creating...' : `🚀 Create ${bulkCount} Demo Docs`}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-600 text-red-300 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Success Display */}
      {result && (
        <div className="bg-green-900/30 border border-green-600 text-green-300 rounded-lg p-4">
          ✅ Success: {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}

export default Ingest;

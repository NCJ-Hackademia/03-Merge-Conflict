import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, FileText, Users, Calendar, Target, Code2, Loader2 } from "lucide-react";

function Code() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("all");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  // Load projects on component mount
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

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchParams = {
        query: query.trim(),
        k: 10,
        projectName: selectedProject === "all" ? null : selectedProject
      };

      const response = await window.electronAPI.searchRAG(searchParams);
      if (response.success) {
        setResults(response.data);
        setActiveTab("results");
      } else {
        console.error("Search failed:", response.error);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSearch();
    }
  };

  return (
    <div className="h-full grid gap-4 xl:gap-6 grid-rows-[auto_1fr]">
      <Card className="shadow-sm bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            rows={4} 
            placeholder="Describe what you want to generate or search via CLI..." 
            className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </CardContent>
      </Card>
      <Card className="min-h-0 shadow-sm bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Editor</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          <div className="rounded-md border border-gray-600 bg-gray-700/40 p-3 min-h-[300px] text-sm text-gray-300">
            Your code or results will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Code;

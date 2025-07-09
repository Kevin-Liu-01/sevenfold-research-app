import React, { useEffect, useState } from 'react';
import supabase from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface Project {
  id: string;
  name: string;
  research_question: string;
  keywords: string[];
  created_at: string;
}

const SettingsViewer: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user]);

  if (loading) {
    return <div className="p-8">Loading project settings...</div>;
  }

  if (!project) {
    return <div className="p-8">No project found</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Project Settings</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Project Name</h3>
          <p className="text-gray-700">{project.name}</p>
        </div>
        <div>
          <h3 className="font-semibold">Research Question</h3>
          <p className="text-gray-700">{project.research_question}</p>
        </div>
        <div>
          <h3 className="font-semibold">Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {project.keywords.map((keyword, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {keyword}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Created At</h3>
          <p className="text-gray-700">
            {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsViewer;
import React, { useEffect, useState } from 'react';

import SidebarButton from './SidebarButton';
import { HomeIcon, Cog6ToothIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNavigate, useParams } from 'react-router-dom';
import supabase from '../../services/supabaseClient';

interface SidebarProps {
  activeViewer: string;
  setActiveViewer: (viewer: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeViewer, setActiveViewer }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [sourcePapers, setSourcePapers] = useState<Paper[]>([]);
  const [candidatePapers, setCandidatePapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────── Fetch project + papers
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        // project
        const { data: proj, error: projErr } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        if (projErr) throw projErr;
        setProject(proj);
        // papers
        const { data: papers, error: papersErr } = await supabase
          .from('papers')
          .select('*')
          .eq('project_id', projectId);
        if (papersErr) throw papersErr;
        setSourcePapers(papers.filter(p => p.type === 'source'));
        setCandidatePapers(papers.filter(p => p.type === 'candidate'));
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  return (
    <aside className="w-56 bg-gray-100 h-full flex flex-col p-4 gap-2">
      <section className="flex flex-col gap-2">
        <SidebarButton
          icon={<HomeIcon />}
          text="Return Home"
          active={activeViewer === 'home'}
          onClick={() => navigate('/home')}
        />
        <SidebarButton
          icon={<Cog6ToothIcon />}
          text="Settings"
          active={activeViewer === 'settings'}
          onClick={() => setActiveViewer('settings')}
        />
        <SidebarButton
          icon={<ArrowUpTrayIcon />}
          text="Upload"
          active={activeViewer === 'upload'}
          onClick={() => setActiveViewer('upload')}
        />
        <SidebarButton
          icon={<MagnifyingGlassIcon />}
          text="Search"
          active={activeViewer === 'search'}
          onClick={() => setActiveViewer('search')}
        />
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Source Papers</h3>
        <ul className="space-y-1 text-sm">
          {sourcePapers.length ? sourcePapers.map(p => <li key={p.id} className="truncate" title={p.filename}>{p.filename}</li>) : <li className="text-gray-400">None yet</li>}
        </ul>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Candidate Papers</h3>
        <ul className="space-y-1 text-sm">
          {candidatePapers.length ? candidatePapers.map(p => <li key={p.id} className="truncate" title={p.filename}>{p.filename}</li>) : <li className="text-gray-400">None yet</li>}
        </ul>
      </section>

    </aside>
  );
};

export default Sidebar;
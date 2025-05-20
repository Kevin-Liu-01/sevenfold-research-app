import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [researchQuestion, setResearchQuestion] = useState('');
  const [keywords, setKeywords] = useState('');

  const handleCancel = () => {
    navigate('/home');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement project creation logic
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleCreate}
        className="w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold mb-6">Create a new project</h2>
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-1">Project Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Project name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-1">Research Question</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What is your main research question?"
            value={researchQuestion}
            onChange={e => setResearchQuestion(e.target.value)}
            required
          />
        </div>
        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-1">Keywords</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Comma-separated keywords (e.g. AI, biology, statistics)"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewProjectPage; 
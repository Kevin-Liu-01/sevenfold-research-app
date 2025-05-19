import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Welcome to Ketspen</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your academic research workspace for finding, storing, annotating, and writing papers.
        </p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default LandingPage; 
'use client';

import { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import PhotoDashboard from './components/PhotoDashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'capture' | 'dashboard'>('capture');
  const [refreshDashboard, setRefreshDashboard] = useState(0);

  const handlePhotoTaken = () => {
    setRefreshDashboard(prev => prev + 1);
    // Optional: Auto-switch to dashboard after photo capture
    // setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">📸 Photo Capture App</h1>
            <div className="text-sm text-gray-500">
              Mobile-friendly • Real-time • Printable PDF
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('capture')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'capture'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📷 Capture Photo
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Photo Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'capture' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Capture Documents with Front, Back & Signature
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Capture both sides of documents (ID cards, licenses, etc.) and add digital signatures. 
                Perfect for verification, applications, and record-keeping with instant printing and PDF output.
              </p>
            </div>
            <div className="flex justify-center">
              <CameraCapture onPhotoTaken={handlePhotoTaken} />
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Real-time Photo Dashboard
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                View all captured photos in real-time. Select photos to generate 
                printable PDFs or download individual images.
              </p>
            </div>
            <PhotoDashboard key={refreshDashboard} />
          </div>
        )}
      </main>

      {/* Instructions for Mobile */}
      <div className="bg-blue-50 border-t border-blue-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">📱 Mobile Instructions</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">For Document Capture:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Open this website on your mobile device</li>
                <li>Click &quot;Start Camera&quot; to access your device camera</li>
                <li>Grant camera permissions when prompted</li>
                <li>Capture the front side of your document</li>
                <li>Capture the back side of your document</li>
                <li>Draw your signature in the signature area</li>
                <li>Complete the document capture process</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Viewing & Printing:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Switch to &quot;Photo Dashboard&quot; tab</li>
                <li>View all captured photos in real-time</li>
                <li>Select multiple photos for batch PDF generation</li>
                <li>Download individual photos or create printable PDFs</li>
                <li>PDFs are optimized for standard paper sizes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>Photo Capture App • Real-time Firebase Integration • Mobile Optimized</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

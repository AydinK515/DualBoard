import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Zap, Eye, Palette, Download, Maximize } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/public/Dualboard logo.jpg" 
                alt="DualBoard Logo" 
                className="w-10 h-10 rounded-lg object-cover shadow-sm"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DualBoard</h1>
                <p className="text-sm text-gray-600">Face-to-Face Collaboration</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Collaborative Whiteboard<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
              Built for Two
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            DualBoard revolutionizes face-to-face collaboration with a unique dual-canvas design. 
            Perfect for tutoring, brainstorming, presentations, and any scenario where two people 
            need to share ideas on the same digital whiteboard.
          </p>
          
          {/* CTA Button */}
          <Link 
            to="/whiteboard"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Zap size={24} />
            Create Whiteboard
          </Link>
        </div>

        {/* Feature Preview Image Placeholder */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2"></div>
            <div className="p-8">
              <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="text-white" size={32} />
                  </div>
                  <p className="text-gray-600 text-lg">Interactive Dual-Canvas Interface</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose DualBoard?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Designed specifically for face-to-face collaboration with innovative features 
              that make working together seamless and intuitive.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Eye className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Dual Perspective Views</h3>
              <p className="text-gray-600 leading-relaxed">
                Each person gets their own optimized view while working on the same canvas. 
                Perfect for tutoring sessions where both participants need clear visibility.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6">
                <Users className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Role Switching</h3>
              <p className="text-gray-600 leading-relaxed">
                Instantly flip between editor and viewer roles with a single click. 
                Great for alternating between teacher/student or presenter/audience modes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6">
                <Palette className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Rich Drawing Tools</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete set of drawing tools including pen, eraser, shapes, arrows, and custom colors. 
                Everything you need for effective visual communication.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl border border-orange-200">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                <Download className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Export & Save</h3>
              <p className="text-gray-600 leading-relaxed">
                Save your collaborative work as high-quality PNG images. 
                Perfect for keeping records of tutoring sessions or meeting notes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl border border-indigo-200">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-6">
                <Maximize className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Fullscreen Mode</h3>
              <p className="text-gray-600 leading-relaxed">
                Distraction-free fullscreen mode for focused collaboration sessions. 
                Hide all UI elements and focus purely on the content.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl border border-teal-200">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Instant Setup</h3>
              <p className="text-gray-600 leading-relaxed">
                No registration, no downloads, no setup. Just click "Create Whiteboard" 
                and start collaborating immediately in your browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfect For Every Collaboration
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              DualBoard adapts to your needs, whether you're teaching, learning, 
              brainstorming, or presenting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="font-semibold text-gray-900 mb-2">Tutoring</h3>
              <p className="text-gray-600 text-sm">One-on-one teaching sessions with clear visual explanations</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-semibold text-gray-900 mb-2">Brainstorming</h3>
              <p className="text-gray-600 text-sm">Collaborative idea generation and mind mapping</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Presentations</h3>
              <p className="text-gray-600 text-sm">Interactive presentations with audience participation</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="font-semibold text-gray-900 mb-2">Design Review</h3>
              <p className="text-gray-600 text-sm">Collaborative design feedback and iteration</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Collaborating?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of educators, students, and professionals who use DualBoard 
            for more effective face-to-face collaboration.
          </p>
          <Link 
            to="/whiteboard"
            className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Zap size={24} />
            Create Whiteboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <img 
                src="/public/Dualboard logo.jpg" 
                alt="DualBoard Logo" 
                className="w-8 h-8 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-xl font-bold">DualBoard</h3>
                <p className="text-gray-400 text-sm">Face-to-Face Collaboration</p>
              </div>
            </div>
          </div>
          
          <div className="text-center text-gray-400">
            <p>&copy; 2025 DualBoard. Built for better collaboration.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Calendar, Palette, Music, Brain, MessageSquare } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">SkyRas</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Sign In
              </Link>
              <Link
                href="/login?signup=true"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                6 AI Agents • Multi-Modal Creation
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Your AI-Powered
                <span className="block text-blue-600">Content Studio</span>
              </h1>

              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Generate images, videos, and music. Ensure compliance. Schedule distribution.
                All powered by a team of specialized AI agents working together.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login?signup=true"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all hover:scale-105"
                >
                  Start Creating Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-700 font-medium rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors">
                  Watch Demo
                  <span className="text-xl">▶</span>
                </button>
              </div>

              <div className="mt-8 flex items-center gap-8 text-sm text-slate-600">
                <div>
                  <div className="font-semibold text-slate-900">10,000+</div>
                  <div>Assets Created</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">99.9%</div>
                  <div>Compliance Rate</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">6</div>
                  <div>AI Agents</div>
                </div>
              </div>
            </div>

            {/* Right Column - Demo Video Placeholder */}
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl shadow-2xl flex items-center justify-center border border-slate-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">▶</span>
                  </div>
                  <p className="text-slate-600 font-medium">Watch SkyRas in Action</p>
                  <p className="text-sm text-slate-500 mt-1">2 minute demo</p>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -bottom-4 -left-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-slate-200">
                <div className="text-xs text-slate-600">Image Generated</div>
                <div className="text-sm font-semibold text-slate-900">0.8s ⚡</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-slate-200">
                <div className="text-xs text-slate-600">Compliance</div>
                <div className="text-sm font-semibold text-green-600">✓ Passed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Your AI Team Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Meet Your AI Team
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Six specialized agents working in harmony to handle every aspect of content creation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Marcus */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Marcus</h3>
              <p className="text-sm text-slate-500 mb-3">Conversational Orchestrator</p>
              <p className="text-slate-600 leading-relaxed">
                Your friendly interface to the platform. Understands your needs and coordinates the other agents to get things done.
              </p>
            </div>

            {/* Giorgio */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Giorgio</h3>
              <p className="text-sm text-slate-500 mb-3">Visual Content Generator</p>
              <p className="text-slate-600 leading-relaxed">
                Creates stunning images and videos using multiple AI providers. Optimizes prompts and handles all generation workflows.
              </p>
            </div>

            {/* Cassidy */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Cassidy</h3>
              <p className="text-sm text-slate-500 mb-3">Compliance & Licensing</p>
              <p className="text-slate-600 leading-relaxed">
                Scans content for copyright, trademark, and policy violations. Ensures everything is safe to publish.
              </p>
            </div>

            {/* Jamal */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Jamal</h3>
              <p className="text-sm text-slate-500 mb-3">Distribution & Scheduling</p>
              <p className="text-slate-600 leading-relaxed">
                Plans optimal posting times and distributes content across platforms. Maximizes reach and engagement.
              </p>
            </div>

            {/* Letitia */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-pink-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Letitia</h3>
              <p className="text-sm text-slate-500 mb-3">Music & Audio Specialist</p>
              <p className="text-slate-600 leading-relaxed">
                Generates music, sound effects, and audio content. Perfect soundtracks for your visual creations.
              </p>
            </div>

            {/* Atlas */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Atlas</h3>
              <p className="text-sm text-slate-500 mb-3">Strategic Coordinator</p>
              <p className="text-slate-600 leading-relaxed">
                The mastermind behind the scenes. Routes complex requests and ensures all agents work together efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Built For Creators
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Whether you're solo or part of a team, SkyRas scales with your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Content Creators */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Content Creators</h3>
              <p className="text-slate-600 leading-relaxed">
                Generate thumbnails, social media posts, and video content in minutes. Focus on creativity, not tools.
              </p>
            </div>

            {/* Marketing Teams */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Marketing Teams</h3>
              <p className="text-slate-600 leading-relaxed">
                Create campaign assets at scale. Ensure brand compliance and schedule distribution across channels.
              </p>
            </div>

            {/* Agencies */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Creative Agencies</h3>
              <p className="text-slate-600 leading-relaxed">
                Deliver more projects faster. Multi-modal workflows and compliance checking keep clients happy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Everything You Need,
                <span className="block text-blue-400">Nothing You Don't</span>
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Simple, powerful, and built for speed. Start creating in seconds.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Multi-Modal Generation</h4>
                    <p className="text-slate-400">Images, videos, music, and more from a single interface</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Smart Compliance</h4>
                    <p className="text-slate-400">Automatic scanning for copyright and policy violations</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Workflow Templates</h4>
                    <p className="text-slate-400">Pre-built workflows for common creative tasks</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Unified Library</h4>
                    <p className="text-slate-400">All your assets organized and searchable in one place</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚡</div>
                  <div className="text-2xl font-bold">Lightning Fast</div>
                  <div className="text-blue-200 mt-2">Generate in seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Ready to Create?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Join thousands of creators using AI to supercharge their content
          </p>

          <Link
            href="/login?signup=true"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-all hover:scale-105 shadow-lg"
          >
            Start Creating Free
            <ArrowRight className="w-6 h-6" />
          </Link>

          <p className="mt-4 text-sm text-slate-500">
            No credit card required • Free tier available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900">SkyRas</span>
              </div>
              <p className="text-sm text-slate-600">
                AI-powered content creation studio
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-slate-900">Features</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Pricing</Link></li>
                <li><Link href="#" className="hover:text-slate-900">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-slate-900">About</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Blog</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-slate-900">Privacy</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Terms</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-500">
            © 2026 SkyRas. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

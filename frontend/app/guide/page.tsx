"use client";

import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function Guide() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-zinc-900 mb-4">
          How to Use Marcus
        </h1>
        <p className="text-xl text-zinc-600 mb-12">
          A quick guide to getting started with your personalized workflow.
        </p>

        <div className="space-y-8">
          {/* Getting Started */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              Getting Started
            </h2>
            <ol className="space-y-4 text-zinc-700">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">1.</span>
                <div>
                  <p className="font-medium mb-1">Enter your access code</p>
                  <p className="text-sm text-zinc-600">
                    When you first open Marcus, you'll be asked for an access code. Enter the code you received to continue.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">2.</span>
                <div>
                  <p className="font-medium mb-1">Answer 5 quick questions</p>
                  <p className="text-sm text-zinc-600">
                    Marcus will ask about your role, platforms, time availability, goals, and content type. Be honest—this helps Marcus build the right workflow for you.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">3.</span>
                <div>
                  <p className="font-medium mb-1">Choose your workflow</p>
                  <p className="text-sm text-zinc-600">
                    Marcus will propose 1-2 workflows tailored to your situation. Pick the one that feels right.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">4.</span>
                <div>
                  <p className="font-medium mb-1">Review your weekly structure</p>
                  <p className="text-sm text-zinc-600">
                    You'll get a day-by-day breakdown with tasks, time blocks, and priorities. This is your system.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* Using Your Workflow */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              Using Your Workflow
            </h2>
            <div className="space-y-4 text-zinc-700">
              <div>
                <p className="font-medium mb-2">View your workflow</p>
                <p className="text-sm text-zinc-600">
                  Go to your <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link> to see all your saved workflows. Click on any workflow to see the full weekly structure and task breakdown.
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Adjust as needed</p>
                <p className="text-sm text-zinc-600">
                  Chat with Marcus to modify your workflow. Say things like "I need to add client check-ins on Tuesdays" or "Can we reduce the time on editing?"
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Get help anytime</p>
                <p className="text-sm text-zinc-600">
                  Marcus remembers your workflow and can help you figure out where new tasks fit, how to adjust your schedule, or answer questions about your system.
                </p>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
              Tips for Success
            </h2>
            <ul className="space-y-3 text-zinc-700">
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-sm">Be realistic about your time. Marcus adapts to what you actually have available.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-sm">Start with the "must-do" tasks. The "nice-to-have" items can wait.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-sm">Your workflow is a starting point. Adjust it as you learn what works for you.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-sm">Use the dashboard to track multiple workflows if you manage different types of work.</span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
            <p className="text-lg font-medium text-zinc-900 mb-4">
              Ready to get started?
            </p>
            <Link
              href="/app"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Marcus
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


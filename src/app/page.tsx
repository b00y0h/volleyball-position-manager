"use client";

import { VolleyballCourt } from "@/components/VolleyballCourt";

export default function Home() {
  return (
    <div className="p-4 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Volleyball Rotations Visualizer
          </h2>
        </div>
      </div>

      {/* Minimal VolleyballCourt component - no config needed */}
      <div className="mb-4">
        <VolleyballCourt readOnly={false} />
      </div>
    </div>
  );
}

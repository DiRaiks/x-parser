"use client";

import { useState } from "react";

export default function ParsingMethodsInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        ℹ️ Parsing Methods Info
        <span
          className={`transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ⬇️
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-blue-50 rounded-lg text-sm">
          <h3 className="font-semibold mb-3">Available parsing methods:</h3>

          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-3">
              <div className="font-medium text-blue-700">🔑 Twitter API</div>
              <div className="text-gray-600">
                • Official X/Twitter API
                <br />• Requires API keys
                <br />• Request limitations
                <br />• Most accurate data
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-3">
              <div className="font-medium text-green-700">
                🔐 Twitter Session (RECOMMENDED)
              </div>
              <div className="text-gray-600">
                • Uses user session cookies
                <br />• No API keys required
                <br />• Includes comments and replies
                <br />• Stable and reliable
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-3">
              <div className="font-medium text-blue-700">
                📈 Timeline Parser
              </div>
              <div className="text-gray-600">
                • Parse home timeline feed
                <br />• Bulk tweet collection
                <br />• Uses user session
                <br />• Fast import of recent tweets
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-3">
              <div className="font-medium text-purple-700">✏️ Manual Input</div>
              <div className="text-gray-600">
                • Copy content manually
                <br />• Always works
                <br />• Full control over data
                <br />• For special cases
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
            <div className="font-medium text-yellow-800">
              💡 Recommendations:
            </div>
            <div className="text-yellow-700 text-xs mt-1">
              1. Use <strong>Twitter Session</strong> - stable with comments
              <br />
              2. <strong>Timeline Parser</strong> for bulk import from feed
              <br />
              3. Use <strong>Manual Input</strong> for individual tweets
              <br />
              4. Twitter API only if you have official keys
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

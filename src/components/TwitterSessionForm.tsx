"use client";

import { useState } from "react";

interface TwitterSessionFormProps {
  onSubmit: (url: string, cookies: object) => void;
  isLoading?: boolean;
}

export default function TwitterSessionForm({
  onSubmit,
  isLoading,
}: TwitterSessionFormProps) {
  const [url, setUrl] = useState("");
  const [cookiesText, setCookiesText] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      alert("Enter tweet URL");
      return;
    }

    // Parse cookies from text format
    const cookies: Record<string, string> = {};
    if (cookiesText) {
      const cookiePairs = cookiesText.split(";");
      for (const pair of cookiePairs) {
        const [key, value] = pair.split("=").map((s) => s.trim());
        if (key && value) {
          cookies[key] = value;
        }
      }
    }

    onSubmit(url, cookies);
  };

  return (
    <div className="space-y-4">
      {/* Instructions Toggle */}
      <button
        type="button"
        onClick={() => setShowInstructions(!showInstructions)}
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        🔐 How to get cookies from browser?
        <span
          className={`transform transition-transform ${
            showInstructions ? "rotate-180" : ""
          }`}
        >
          ⬇️
        </span>
      </button>

      {/* Instructions */}
      {showInstructions && (
        <div className="p-4 bg-blue-50 rounded-lg text-sm">
          <h4 className="font-medium text-blue-800 mb-2">
            Cookie extraction instructions:
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>
              Open{" "}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                X.com
              </a>{" "}
              and log in to your account
            </li>
            <li>Press F12 or Right-click → &quot;Inspect Element&quot;</li>
            <li>
              Go to &quot;Application&quot; tab (Chrome) or &quot;Storage&quot;
              tab (Firefox)
            </li>
            <li>Find &quot;Cookies&quot; → &quot;https://x.com&quot;</li>
            <li>
              Copy important cookies:{" "}
              <code className="bg-blue-100 px-1 rounded">auth_token</code>,{" "}
              <code className="bg-blue-100 px-1 rounded">ct0</code>
            </li>
            <li>
              Paste in format:{" "}
              <code className="bg-blue-100 px-1 rounded">
                auth_token=abc123; ct0=def456
              </code>
            </li>
          </ol>
          <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
            <p className="text-yellow-800 text-xs">
              ⚠️ <strong>Security:</strong> Don&apos;t share cookies with
              others! They provide access to your account.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tweet URL:
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://x.com/username/status/1234567890"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cookies (optional):
          </label>
          <textarea
            value={cookiesText}
            onChange={(e) => setCookiesText(e.target.value)}
            placeholder="auth_token=xyz123; ct0=abc456; other_cookie=value"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            If cookies not provided, will use public access (limited)
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !url}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
        >
          {isLoading ? "Fetching tweet..." : "Get tweet with session"}
        </button>
      </form>

      {/* Benefits */}
      <div className="p-3 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-800 mb-1">
          ✅ Session method benefits:
        </h4>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• Access to private accounts (if you follow them)</li>
          <li>• Get accurate metrics (likes, retweets)</li>
          <li>• Access to replies and threads</li>
          <li>• Works with any tweets</li>
          <li>• No API keys required</li>
        </ul>
      </div>
    </div>
  );
}

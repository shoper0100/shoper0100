import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Welcome to <span className="text-blue-500">Five Dollar Club</span>
        </h1>
        <p className="text-xl text-gray-400 mb-4">
          Your $5 Journey to Financial Freedom Starts Here
        </p>
        <p className="text-lg text-blue-400 font-semibold mb-2">
          ✨ Earn Passive Income WITHOUT Referring - Up to 5 Layers Deep!
        </p>
        <p className="text-lg text-gray-500 mb-8">
          Join once for $5 and earn from your team&apos;s growth automatically. Refer more to multiply your earnings!
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Join for $5
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">🎯 Passive Income (No Referring!)</h3>
          <p className="text-gray-400">
            Earn automatically from your team&apos;s growth - up to 5 layers deep. No recruiting required!
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">💰 Refer = Earn MORE!</h3>
          <p className="text-gray-400">
            Every person you refer multiplies your earnings. Get 95% direct bonuses + team commissions!
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">Exclusive Royalty Pool</h3>
          <p className="text-gray-400">
            Top earners share in daily royalty rewards - 4 tiers of elite passive income
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-500">13</div>
          <div className="text-gray-400 text-sm mt-1">Levels</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-500">26</div>
          <div className="text-gray-400 text-sm mt-1">Matrix Layers</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-500">4</div>
          <div className="text-gray-400 text-sm mt-1">Royalty Tiers</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-500">150%</div>
          <div className="text-gray-400 text-sm mt-1">Max ROI</div>
        </div>
      </div>
    </div>
  );
}

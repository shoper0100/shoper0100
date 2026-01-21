import PresentationSection from '@/components/PresentationSection';

export default function PresentationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
            <PresentationSection />

            <div className="text-center pb-20">
                <a
                    href="/"
                    className="bg-white/10 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-white/20 transition-all border border-white/20"
                >
                    ← Back to Home
                </a>
            </div>
        </div>
    );
}

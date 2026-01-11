'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnect from '../wallet/WalletConnect';

export default function Header() {
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Register', href: '/register' },
        { name: 'Upgrade', href: '/upgrade' },
        { name: 'Income', href: '/income' },
        { name: 'Team', href: '/team' },
        { name: 'Sponsor', href: '/sponsor' },
        { name: 'Admin', href: '/admin' },
        { name: 'Royalty', href: '/royalty' },
    ];

    return (
        <header className="bg-gray-900 border-b border-gray-800">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">R</span>
                        </div>
                        <span className="text-white font-bold text-xl">RideBNB</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`text-sm font-medium transition-colors ${isActive
                                            ? 'text-blue-500'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Wallet Connect */}
                    <WalletConnect />
                </div>
            </div>
        </header>
    );
}


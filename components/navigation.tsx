'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') return null;
  if (!session) return null;

  const menuItems = [
    {
      label: 'League',
      items: [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/leagues', label: 'My Leagues' },
        { href: '/standings', label: 'Standings' },
      ]
    },
    {
      label: 'Matches',
      items: [
        { href: '/matches', label: 'My Matches' },
        { href: '/matches/schedule', label: 'Schedule' },
        { href: '/matches/results', label: 'Results' },
      ]
    },
    {
      label: 'Account',
      items: [
        { href: '/profile', label: 'Profile' },
        { href: '/profile/settings', label: 'Settings' },
      ]
    }
  ];

  if (session.user.isAdmin) {
    menuItems.push({
      label: 'Admin',
      items: [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/leagues', label: 'Leagues' },
        { href: '/admin/matches', label: 'Matches' },
      ]
    });
  }

  return (
    <nav className="bg-white border-b border-gray-200" ref={menuRef}>
      <div className="container-width bg-white">
        {/* Mobile header - clean logo only */}
        <div className="flex flex-col items-center py-4 md:hidden">
          <Link href="/dashboard" className="mb-2">
            <Image
              src="/logo.png"
              alt="Durango Racquetball Association"
              width={192}
              height={56}
              className="h-12 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Desktop Logo Section */}
        <div className="hidden flex-col items-center py-4 md:flex">
          <Link href="/dashboard" className="mb-2 flex items-center">
            <Image
              src="/logo.png"
              alt="Durango Racquetball Association"
              width={220}
              height={64}
              className="h-16 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Menu */}
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3 md:flex-nowrap md:gap-6">
          {menuItems.map((menu) => (
            <div key={menu.label} className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === menu.label ? null : menu.label)}
                className={`${
                  menu.items.some(item => pathname === item.href)
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {menu.label}
              </button>

              {/* Dropdown */}
              {activeDropdown === menu.label && (
                <div className="absolute left-0 mt-4 min-w-max bg-white border border-black shadow-lg z-50" style={{ backgroundColor: 'white' }}>
                  <div style={{ backgroundColor: 'white' }}>
                    {menu.items
                      .filter(item => pathname !== item.href)
                      .map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-6 py-4 text-base font-medium transition-colors no-underline text-black hover:bg-gray-100"
                          style={{
                            textDecoration: 'none',
                            color: 'black',
                            fontSize: '18px',
                            padding: '16px 24px'
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Sign out button */}
          <button
            onClick={() => signOut()}
            className="btn-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

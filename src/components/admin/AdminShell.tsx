"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  ShoppingCart, 
  FileText, 
  Settings,
  Store,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { getSiteConfig } from "@/lib/config/site";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/content", label: "Site Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const config = getSiteConfig();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">{config.name}</span>
          </Link>
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${isActive 
                      ? "bg-indigo-600 text-white" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Quick Stats in Sidebar */}
          <div className="mt-8 rounded-xl bg-slate-800/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quick Stats
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Revenue
                </div>
                <span className="text-sm font-semibold text-white">R12,450</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <ShoppingCart className="h-4 w-4 text-blue-400" />
                  Orders
                </div>
                <span className="text-sm font-semibold text-white">24</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Users className="h-4 w-4 text-purple-400" />
                  Customers
                </div>
                <span className="text-sm font-semibold text-white">156</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Back to Store */}
        <div className="border-t border-slate-800 p-3">
          <Link 
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Store className="h-5 w-5" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden rounded-lg p-2 hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search..."
                className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative rounded-lg p-2 hover:bg-slate-100">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Profile */}
            <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">A</span>
              </div>
              <span className="hidden text-sm font-medium sm:block">Admin</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your store from here
            </p>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

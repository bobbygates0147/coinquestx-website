import React from 'react';
import { Home, Users, Lock, Settings, Package } from 'lucide-react';

const navItems = [
  { label: 'Users', icon: <Users />, tab: 'users' },
  { label: 'Finance', icon: <Package />, tab: 'finance' },
  { label: 'Security', icon: <Lock />, tab: 'security' },
  { label: 'System', icon: <Settings />, tab: 'system' },
  { label: 'Optional', icon: <Home />, tab: 'optional' },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4 space-y-4">
      <h2 className="text-xl font-semibold">Admin Panel</h2>
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li
            key={item.label}
            className={`flex items-center space-x-2 p-2 rounded cursor-pointer 
              ${activeTab === item.tab ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => setActiveTab(item.tab)}
          >
            {item.icon}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

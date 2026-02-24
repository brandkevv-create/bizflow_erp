"use client";

import { useState } from "react";
import { Building2, CreditCard, Users, Bell, Store } from "lucide-react";
import { BusinessTab } from "./tabs/business-tab";
import { TeamTab } from "./tabs/team-tab";
import { IntegrationsTab } from "./tabs/integrations-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { LocationsTab } from "./tabs/locations-tab";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your business settings and integrations</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
                <TabButton
                    id="profile"
                    label="Business Profile"
                    icon={Building2}
                    active={activeTab === 'profile'}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="team"
                    label="Team & Permissions"
                    icon={Users}
                    active={activeTab === 'team'}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="locations"
                    label="Locations"
                    icon={Store}
                    active={activeTab === 'locations'}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="integrations"
                    label="Integrations"
                    icon={CreditCard}
                    active={activeTab === 'integrations'}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="notifications"
                    label="Notifications"
                    icon={Bell}
                    active={activeTab === 'notifications'}
                    onClick={setActiveTab}
                />
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'profile' && <BusinessTab />}
                {activeTab === 'team' && <TeamTab />}
                {activeTab === 'locations' && <LocationsTab />}
                {activeTab === 'integrations' && <IntegrationsTab />}
                {activeTab === 'notifications' && <NotificationsTab />}
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabButton({ id, label, icon: Icon, active, onClick }: any) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${active
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    )
}

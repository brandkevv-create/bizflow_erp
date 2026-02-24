"use client";

import { useSettingsStore } from "@/store/settings-store";
import { UserPlus } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

import { useModal } from "@/hooks/use-modal-store";

export function TeamTab() {
    const { team, deleteTeamMember, roles } = useSettingsStore();
    const { onOpen } = useModal();

    return (
        <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-semibold text-slate-900">Team Members</h3>
                        <p className="text-sm text-slate-500">Manage user roles and permissions</p>
                    </div>
                    <button
                        onClick={() => onOpen('ADD_TEAM_MEMBER')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                        <UserPlus size={16} />
                        Invite Member
                    </button>
                </div>

                <div className="space-y-4">
                    {team.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                    {(member.full_name || 'U').substring(0, 2)}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{member.full_name}</p>
                                    <p className="text-xs text-slate-500">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded capitalize">
                                    {member.role}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${member.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {member.status}
                                </span>
                                <button
                                    onClick={() => onOpen('EDIT_TEAM_MEMBER', member)}
                                    className="text-slate-400 hover:text-slate-600 font-medium text-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteTeamMember(member.id)}
                                    className="text-slate-400 hover:text-red-500 font-medium text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Role Permissions */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <h3 className="font-semibold text-slate-900">Role Permissions</h3>
                    <p className="text-sm text-slate-500">Configure what each role can access and manage</p>
                </div>

                <div className="space-y-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {roles && roles.map((roleDef: { role: string; permissions: any[] }, idx: number) => (
                        <PermissionRow
                            key={idx}
                            role={roleDef.role}
                            permissions={roleDef.permissions}
                        />
                    ))}
                    {!roles && <p className="text-sm text-slate-500">Loading permissions...</p>}
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PermissionRow({ role, permissions }: any) {
    return (
        <div className="p-4 border border-slate-100 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-3 capitalize">{role}</h4>
            <div className="grid grid-cols-2 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {permissions.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className={`w-2 h-2 rounded-full ${p.allowed ? 'bg-green-500' : 'bg-slate-200'}`} />
                        <span className={p.allowed ? '' : 'text-slate-400'}>{p.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

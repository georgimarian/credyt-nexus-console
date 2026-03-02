import { useState } from "react";
import { Users } from "lucide-react";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const teamMembers = [
  { name: "Georgiana Marian", email: "georgiana@revenew.co", role: "owner" as const },
  { name: "Georgiana Marian", email: "georgi.marian@yahoo.com", role: "member" as const },
  { name: "georgi.marian@...", email: "georgi.marian@gmail.com", role: "member" as const },
];

const roleBadgeClass: Record<string, string> = {
  owner: "border border-dotted border-white/30 text-white/60 text-xs px-2 py-0.5 font-mono",
  member: "border border-dotted border-white/15 text-white/30 text-xs px-2 py-0.5 font-mono",
  admin: "border border-dotted border-teal-400/30 text-teal-400/60 text-xs px-2 py-0.5 font-mono",
};

export default function TeamManagement() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  return (
    <SettingsLayout>
      {/* TEAM MEMBERS */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-xs text-white/50">
          ┌─ TEAM MEMBERS ──────────────────────────────────────────────┐
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-white text-black px-4 py-2 text-xs font-mono uppercase tracking-wide hover:bg-white/90 transition-colors"
        >
          + Invite Member
        </button>
      </div>

      <table className="table-fixed w-full">
        <thead>
          <tr className="border-b border-dotted border-white/25">
            <th className="text-xs uppercase tracking-wider text-white/40 font-mono font-normal text-left pb-3 w-[35%]">Name</th>
            <th className="text-xs uppercase tracking-wider text-white/40 font-mono font-normal text-left pb-3 w-[35%]">Email</th>
            <th className="text-xs uppercase tracking-wider text-white/40 font-mono font-normal text-left pb-3 w-[20%]">Role</th>
            <th className="text-xs uppercase tracking-wider text-white/40 font-mono font-normal text-right pb-3 w-[10%]">Action</th>
          </tr>
        </thead>
        <tbody>
          {teamMembers.map((member, i) => (
            <tr key={i} className="border-b border-dotted border-white/15 hover:bg-white/[0.02] transition-colors">
              <td className="py-4 text-sm font-mono font-medium text-white">{member.name}</td>
              <td className="py-4 text-sm font-mono text-white/60">{member.email}</td>
              <td className="py-4">
                <span className={roleBadgeClass[member.role]}>{member.role}</span>
              </td>
              <td className="py-4 text-right relative">
                {member.role !== "owner" && (
                  <div className="relative inline-block">
                    <button
                      onClick={() => setMenuOpen(menuOpen === i ? null : i)}
                      className="text-white/30 hover:text-white/70 text-sm font-mono px-2 transition-colors"
                    >
                      ⋮
                    </button>
                    {menuOpen === i && (
                      <div className="absolute right-0 top-full mt-1 border border-dotted border-white/20 bg-[#030712] z-20 min-w-[140px]">
                        <button
                          onClick={() => setMenuOpen(null)}
                          className="block w-full text-left px-3 py-2 text-xs font-mono text-white/60 hover:bg-white/[0.02] hover:text-white transition-colors"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => setMenuOpen(null)}
                          className="block w-full text-left px-3 py-2 text-xs font-mono text-red-400/60 hover:bg-white/[0.02] hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PENDING INVITES */}
      <div className="font-mono text-xs text-white/50 mb-4 mt-10">
        ┌─ PENDING INVITES ───────────────────────────────────────────┐
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="w-8 h-8 text-white/15 mb-3" />
        <span className="text-sm font-mono text-white/40">No pending invites</span>
        <span className="text-xs font-mono text-white/20 mt-1">Invite a team member to get started</span>
      </div>

      {/* INVITE MODAL */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="sr-only">Invite Team Member</DialogTitle>
          <DialogDescription className="sr-only">Send an invite to a new team member</DialogDescription>

          <div className="font-mono text-xs text-white/50 mb-6">
            ┌─ INVITE TEAM MEMBER ────────────────────────────┐
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block font-mono">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="bg-transparent border border-dotted border-white/20 px-3 py-2 font-mono text-sm text-white w-full focus:border-white/50 outline-none"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block font-mono">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="bg-transparent border border-dotted border-white/20 px-3 py-2 font-mono text-sm text-white w-full focus:border-white/50 outline-none appearance-none cursor-pointer"
              >
                <option value="member" className="bg-[#030712]">Member — Can view and manage customers, events</option>
                <option value="admin" className="bg-[#030712]">Admin — Full access except billing and team</option>
                <option value="owner" className="bg-[#030712]">Owner — Full access including billing settings</option>
              </select>
            </div>
          </div>

          <div className="border-t border-dotted border-white/15 pt-6 mt-6 flex justify-between items-center">
            <button
              onClick={() => setShowInviteModal(false)}
              className="border border-dotted border-white/20 text-white bg-transparent px-4 py-2 text-xs font-mono uppercase tracking-wide hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowInviteModal(false)}
              className="bg-white text-black px-4 py-2 text-xs font-mono uppercase tracking-wide hover:bg-white/90 transition-colors"
            >
              Send Invite →
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  );
}

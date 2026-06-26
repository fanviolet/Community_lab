"use client";

import React, { useEffect, useState, useRef } from "react";

type Member = {
  id: string; // profile id
  user_id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
};

interface Props {
  workspaceId: string;
  value?: string | null; // email
  onChange?: (email: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function WorkspaceMemberPicker({ workspaceId, value, onChange, disabled, placeholder }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [focused, setFocused] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/workspace-members?projectId=${workspaceId}`);
        const json = await res.json();
        if (!mounted) return;
        setMembers(json.members || []);
        // try to preselect by value (email)
        if (value) {
          const found = (json.members || []).find((m: Member) => m.email?.toLowerCase() === value.toLowerCase());
          if (found) setSelected(found);
        }
      } catch (err) {
        console.error("Failed to load workspace members", err);
      }
    }
    load();
    return () => { mounted = false; };
  }, [workspaceId]);

  useEffect(() => {
    if (!value) {
      setSelected(null);
    }
  }, [value]);

  const filtered = members.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (m.display_name || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q);
  }).sort((a,b) => {
    // role priority
    const order = (r: string | null) => {
      if (!r) return 99;
      switch (r.toLowerCase()) {
        case "leader": return 1;
        case "admin": return 2;
        case "mentor": return 3;
        case "builder": return 4;
        case "member": return 5;
        default: return 6;
      }
    };
    const oa = order(a.role);
    const ob = order(b.role);
    if (oa !== ob) return oa - ob;
    return (a.display_name || "").localeCompare(b.display_name || "");
  });

  function handleSelect(member: Member) {
    setSelected(member);
    setOpen(false);
    setQuery("");
    onChange?.(member.email || null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((f) => Math.min(f + 1, filtered.length - 1));
      listRef.current?.querySelectorAll('button')[Math.min(focused + 1, filtered.length - 1)]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => Math.max(f - 1, 0));
      listRef.current?.querySelectorAll('button')[Math.max(focused - 1, 0)]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[focused]) handleSelect(filtered[focused]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input type="hidden" name="assigned_to" value={selected?.email || ""} />
      <div>
        <input
          ref={inputRef}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          placeholder={placeholder || "Tìm thành viên bằng tên hoặc email..."}
          value={selected ? `${selected.display_name || selected.email}` : query}
          onFocus={() => { setOpen(true); setQuery(''); if (!selected) setFocused(0); }}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); setOpen(true); setFocused(0); }}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
        />
      </div>
      {open && (
        <div ref={listRef} role="listbox" className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Không tìm thấy thành viên</div>
          ) : (
            filtered.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelect(m)}
                className={`w-full text-left px-3 py-2 hover:bg-muted/50 ${idx===focused? 'bg-muted/30':''}`}
              >
                <div className="flex items-center gap-2">
                  <img src={m.avatar_url || '/avatar-placeholder.png'} alt="" className="h-6 w-6 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.display_name || m.email}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{m.role}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, UserCircle, Store, CheckCircle } from "lucide-react";

interface UserFilterBarProps {
  showSearch?: boolean;
  showRole?: boolean;
  showStore?: boolean;
  showStatus?: boolean;

  storeOptions?: string[];

  onSearchChange?: (value: string) => void;
  onRoleChange?: (value: string) => void;
  onStoreChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
}

export default function UserFilterBar({
  showSearch = false,
  showRole = false,
  showStore = false,
  showStatus = false,

  storeOptions = [],

  onSearchChange,
  onRoleChange,
  onStoreChange,
  onStatusChange,
}: UserFilterBarProps) {
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-6">
      {/* Role */}
      {showRole && (
        <Select onValueChange={(v) => onRoleChange?.(v)}>
          <SelectTrigger className="w-[200px]">
            <UserCircle size={18} />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Merchant Owner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Store */}
      {showStore && (
        <Select onValueChange={(v) => onStoreChange?.(v)}>
          <SelectTrigger className="w-[200px]">
            <Store size={18} />
            <SelectValue placeholder="All Stores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {storeOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Status */}
      {showStatus && (
        <Select onValueChange={(v) => onStatusChange?.(v)}>
          <SelectTrigger className="w-[200px]">
            <CheckCircle size={18} />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search size={16} className="absolute left-2 top-2.5 text-gray-500" />
          <Input
            placeholder="Search user..."
            className="pl-8 w-[200px]"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
          />
        </div>
      )}
    </div>
  );
}

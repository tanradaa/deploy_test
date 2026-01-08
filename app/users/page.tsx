"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import SummaryCard from "../components/SummaryCard";
import UserFilterBar from "../components/filters/UserFilterBar";
import { getUsers } from "@/lib/api/users";
import {
  PenLine,
  Ellipsis,
  Search,
  Key,
  Trash2,
  Filter,
  X,
  UserCircle,
  Store,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UserManagementPage() {
  // Check role
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [store, setStore] = useState("all");
  const [status, setStatus] = useState("all");

  // Mobile Filter State
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("edit");
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editRole, setEditRole] = useState("");
  const [editStores, setEditStores] = useState<string[]>([]);
  const [storeSearch, setStoreSearch] = useState("");

  const [openAccountAction, setOpenAccountAction] = useState(false);
  const [actionUser, setActionUser] = useState<any>(null);

  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // Helpers
  const handleOpenAccountAction = (user: any) => {
    setActionUser(user);
    setOpenAccountAction(true);
  };

  const roleBadgeStyle = (role: string) => {
    switch (role) {
      case "admin":
        return "text-green-700 bg-green-100 border-green-200";
      case "manager":
        return "text-blue-700 bg-blue-100 border-blue-200";
      case "viewer":
        return "text-[#92400E] bg-[#FEF3C7] border-amber-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const roleLabelMap: Record<string, string> = {
    admin: "Merchant Owner",
    manager: "Manager",
    viewer: "Viewer",
  };

  // Handlers
  const handleAddUser = () => {
    setDialogMode("add");
    setSelectedUser(null);
    setEditRole("");
    setEditStores([]);
    setStoreSearch("");
    setNewUser({ first_name: "", last_name: "", email: "", phone: "" });
    setOpenEdit(true);
  };

  const handleEditUser = (user: any) => {
    setDialogMode("edit");
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStores(user.store_branches || []);
    setStoreSearch("");
    setOpenEdit(true);
  };

  // RBAC Guard
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(storedUser);

    if (user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    // ผ่านแล้ว (admin)
    setAuthorized(true);
  }, [router]);

  //  Load data
  useEffect(() => {
    if (!authorized) return;

    getUsers()
      .then((data) => setUsers(data))
      .finally(() => setLoading(false));
  }, [authorized]);

  // Load Data
  useEffect(() => {
    getUsers().then((data) => {
      setUsers(data);
      setFilteredUsers(data);
      setLoading(false);
    });
  }, []);

  // Filter Logic
  // Filter Logic
  useEffect(() => {
    let result = [...users];

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((u) => {
        const roleDisplay = roleLabelMap[u.role] || "";

        return `${u.first_name} ${u.last_name} ${u.email} ${u.role} ${roleDisplay} ${u.store_branches} ${u.status}`
          .toLowerCase()
          .includes(lowerSearch);
      });
    }

    if (role !== "all") result = result.filter((u) => u.role === role);

    if (store !== "all")
      result = result.filter(
        (u) => u.store_branches && u.store_branches.includes(store)
      );

    if (status !== "all") {
      result = result.filter((u) => u.status === status);
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [search, role, store, status, users]);

  useEffect(() => {
    if (selectedUser) {
      setEditStores(selectedUser.store_branches || []);
    }
  }, [selectedUser]);

  // Pagination & Derived Data
  const indexLast = currentPage * itemsPerPage;
  const indexFirst = indexLast - itemsPerPage;
  const currentItems = filteredUsers.slice(indexFirst, indexLast);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const totalUsers = filteredUsers.length;
  const admins = filteredUsers.filter((u) => u.role === "admin").length;
  const managers = filteredUsers.filter((u) => u.role === "manager").length;
  const viewers = filteredUsers.filter((u) => u.role === "viewer").length;

  const storeList = Array.from(
    new Set(users.flatMap((u) => u.store_branches || []))
  );

  const filteredStores = storeList.filter((s) =>
    s.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const isFiltered =
    search || role !== "all" || store !== "all" || status !== "all";

  if (!authorized) {
    return (
      <div className="p-8 text-center text-gray-500">
        Checking permissions...
      </div>
    );
  }

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading users...</div>
    );

  return (
    <div className="space-y-6 mx-4 md:mx-8 pb-10 relative">
      <Header title="User Management" />

      {/* Filter Section */}
      <div className="w-full flex justify-end md:justify-between items-center mb-4">
        {/* 1. Desktop Filters */}
        <div className="hidden md:flex flex-wrap items-center gap-4 w-full">
          <UserFilterBar
            showSearch
            showRole
            showStore
            showStatus
            storeOptions={storeList}
            onSearchChange={setSearch}
            onRoleChange={setRole}
            onStoreChange={setStore}
            onStatusChange={setStatus}
          />
        </div>

        {/* 2. Mobile Filter Button */}
        <button
          onClick={() => setShowMobileFilter(true)}
          className="md:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm active:scale-95 transition-all hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          Filters
          {isFiltered && (
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-0 right-0 -mt-1 -mr-1 animate-pulse" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden ${
          showMobileFilter
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setShowMobileFilter(false)}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[80%] max-w-[300px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          showMobileFilter ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowMobileFilter(false)}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 space-y-6 overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-2.5 text-gray-500"
                />
                <Input
                  placeholder="Search name..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <UserCircle size={18} />
                    <SelectValue placeholder="All Roles" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Merchant Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Store</Label>
              <Select value={store} onValueChange={setStore}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Store size={18} />
                    <SelectValue placeholder="All Stores" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {storeList.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="mt-auto pt-4 border-t">
            <button
              onClick={() => setShowMobileFilter(false)}
              className="w-full py-3 bg-[#275066] text-white rounded-lg font-medium active:scale-95 transition-transform shadow-md"
            >
              Show Results
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard title="Total Users" value={totalUsers} />
        <SummaryCard title="Merchant Owner" value={admins} />
        <SummaryCard title="Managers" value={managers} />
        <SummaryCard title="Viewers" value={viewers} />
      </div>

      <div className="mt-6">
        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full table-auto">
            <thead className="bg-[#275066] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  User
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Role
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Branch
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentItems.length > 0 ? (
                currentItems.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                          alt="avatar"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {u.first_name} {u.last_name}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${roleBadgeStyle(
                          u.role
                        )}`}
                      >
                        {roleLabelMap[u.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 max-w-[200px] truncate">
                      {u.store_branches && u.store_branches.length > 0 ? (
                        u.store_branches.join(", ")
                      ) : (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>{" "}
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>{" "}
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-2 text-gray-500 hover:text-[#275066] hover:bg-gray-100 rounded-lg transition"
                        >
                          <PenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenAccountAction(u)}
                          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Ellipsis className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Card List) */}
        <div className="md:hidden space-y-4">
          {currentItems.length > 0 ? (
            currentItems.map((u, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4"
              >
                {/* Header: Avatar + Status */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      className="w-12 h-12 rounded-full object-cover border"
                      alt="avatar"
                    />
                    <div>
                      <p className="font-bold text-gray-900">
                        {u.first_name} {u.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  {u.status === "active" ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm ring-1 ring-white"></span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm ring-1 ring-white"></span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-gray-50 py-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Role</p>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${roleBadgeStyle(
                        u.role
                      )}`}
                    >
                      {roleLabelMap[u.role]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Branches</p>
                    <p className="text-gray-700 font-medium truncate">
                      {u.store_branches?.length
                        ? u.store_branches.join(", ")
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditUser(u)}
                    className="flex-1 py-2 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                  >
                    <PenLine className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleOpenAccountAction(u)}
                    className="flex-1 py-2 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                  >
                    <Ellipsis className="w-3.5 h-3.5" /> More
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
              No users found matching your filters.
            </div>
          )}
        </div>
      </div>

      {/* Add User Button */}
      <div className="mt-4 flex justify-start">
        <button
          onClick={handleAddUser}
          className="px-4 py-2 bg-[#DDAD51] text-white font-semibold rounded-lg
            transition-all duration-300 shadow-sm
            hover:shadow-md hover:-translate-y-[2px] hover:bg-[#c89a47]
            active:translate-y-[1px]"
        >
          + Add User
        </button>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 text-sm text-gray-600 gap-4 md:gap-0">
        <span className="text-xs md:text-sm text-center md:text-left">
          Showing {indexFirst + 1}-{Math.min(indexLast, filteredUsers.length)}{" "}
          of {filteredUsers.length} users
        </span>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 bg-white"
          >
            &lt;
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded transition-colors ${
                currentPage === i + 1
                  ? "bg-[#DDAD51] text-white border-[#DDAD51]"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 bg-white"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add New User" : " Edit User Role"}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {dialogMode === "add"
                ? "Create a new user and assign role & stores"
                : `Modify ${selectedUser?.first_name}'s access and permissions`}
            </p>
          </DialogHeader>

          {dialogMode === "add" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>User Information</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">First Name</Label>
                  <Input
                    placeholder="Enter first name"
                    value={newUser.first_name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Last Name</Label>
                  <Input
                    placeholder="Enter last name"
                    value={newUser.last_name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  placeholder="Enter phone number"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="flex item-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-600">
                    {selectedUser.first_name[0]}
                    {selectedUser.last_name[0]}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <span
                className={`inline-flex justify-center items-center px-2 py-1 text-xs font-semibold rounded-full min-w-[90px] border ${roleBadgeStyle(
                  selectedUser.role
                )}`}
              >
                Current: {roleLabelMap[selectedUser.role]}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Select Role</Label>
            {[
              {
                value: "manager",
                title: "Store Manager",
                desc: "Can manage inventory, and view all reports",
                badge: "Manager",
              },
              {
                value: "viewer",
                title: "Viewer",
                desc: "Read-only access to assigned stores",
                badge: "Viewer",
              },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setEditRole(r.value)}
                className={`w-full text-left border rounded-lg p-4 transition
        ${
          editRole === r.value
            ? "border-[#DDAD51] bg-[#DDAD51]/10"
            : "hover:bg-gray-50"
        }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-sm text-gray-500">{r.desc}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold min-w-[70px] text-center border ${roleBadgeStyle(
                      r.value
                    )}`}
                  >
                    {r.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Label>Branch Assignment</Label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search branch..."
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => {
                  const checked = editStores.includes(store);
                  return (
                    <button
                      key={store}
                      type="button"
                      onClick={() =>
                        setEditStores((prev) =>
                          prev.includes(store)
                            ? prev.filter((s) => s !== store)
                            : [...prev, store]
                        )
                      }
                      className={`w-full text-left border rounded-lg p-3 transition flex justify-between items-center ${
                        checked
                          ? "border-[#DDAD51] bg-[#DDAD51]/10"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="accent-[#DDAD51]"
                        />
                        <div>
                          <p className="text-sm font-medium">{store}</p>
                          <p className="text-xs text-gray-500">
                            Assigned branch
                          </p>
                        </div>
                      </div>
                      {checked && (
                        <div className="flex gap-2">
                          {selectedUser?.store_branches?.includes(store) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600">
                              Current
                            </span>
                          )}
                          {checked && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#DDAD51]/20 text-[#9a7a2f]">
                              Selected
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  No stores found
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#DDAD51] hover:bg-[#c89a47]"
              onClick={() => {
                setOpenEdit(false);
              }}
            >
              {dialogMode === "add" ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openAccountAction} onOpenChange={setOpenAccountAction}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Actions</DialogTitle>
            <p className="text-sm text-gray-500">
              Manage user account status and access
            </p>
          </DialogHeader>
          {actionUser && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {actionUser.avatar ? (
                  <img
                    src={actionUser.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-600">
                    {actionUser.first_name?.[0]}
                    {actionUser.last_name?.[0]}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {actionUser.first_name} {actionUser.last_name}
                </p>
                <p className="text-sm text-gray-500">{actionUser.email}</p>
              </div>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  actionUser.status === "active"
                    ? "text-green-700 bg-green-100"
                    : "text-red-700 bg-red-100"
                }`}
              >
                Current:{" "}
                {actionUser.status === "active" ? "Enable" : "Disabled"}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-orange-300 bg-orange-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center">
                <Key className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-orange-700">
                  Reset Access Tokens
                </p>
                <p className="text-sm text-orange-600">
                  Force user to log in again when enabled
                </p>
              </div>
            </div>
            <Button
              className="h-9 px-4 border border-orange-400 bg-white text-orange-700 rounded-md font-medium hover:bg-orange-100 hover:text-orange-800"
              onClick={() => alert("Reset (mock)")}
            >
              Reset
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-red-300 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-700">
                  Permanently Delete User
                </p>
                <p className="text-sm text-red-600">
                  Remove user completely (cannot be undone)
                </p>
              </div>
            </div>
            <Button
              className="h-9 px-4 border border-red-400 bg-white text-red-700 rounded-md font-medium hover:bg-red-100 hover:text-red-800"
              onClick={() => alert("Delete (mock)")}
            >
              Delete
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenAccountAction(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#DDAD51] hover:bg-[#c89a47]"
              onClick={() => {
                setOpenAccountAction(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Users,
  Shield,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash2,
} from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  _count: {
    ratings: number;
    reviews: number;
    savedRecipes: number;
    mealPlans: number;
    collections: number;
  };
}

interface Stats {
  total: number;
  admins: number;
  regular: number;
  recentSignups: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        sort,
        order,
      });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, sort, order, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        if (stats) {
          const delta = newRole === "admin" ? 1 : -1;
          setStats({
            ...stats,
            admins: stats.admins + delta,
            regular: stats.regular - delta,
          });
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update role");
      }
    } catch {
      alert("Failed to update role");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        if (stats) {
          const deletedUser = users.find((u) => u.id === userId);
          const wasAdmin = deletedUser?.role === "admin";
          setStats({
            ...stats,
            total: stats.total - 1,
            admins: wasAdmin ? stats.admins - 1 : stats.admins,
            regular: wasAdmin ? stats.regular : stats.regular - 1,
          });
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch {
      alert("Failed to delete user");
    } finally {
      setActionLoading(null);
      setConfirmDelete(null);
    }
  }

  function handleSort(field: string) {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder(field === "createdAt" ? "desc" : "asc");
    }
    setPage(1);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-800">User Management</h2>
      <p className="mt-1 text-sm text-stone-500">
        View registered users, manage roles, and monitor activity.
      </p>

      {/* Stats Cards */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-amber-600" />}
            label="Total Users"
            value={stats.total}
          />
          <StatCard
            icon={<Shield className="h-5 w-5 text-indigo-600" />}
            label="Admins"
            value={stats.admins}
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-stone-500" />}
            label="Regular Users"
            value={stats.regular}
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5 text-emerald-600" />}
            label="Last 30 Days"
            value={stats.recentSignups}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-stone-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-stone-500">
            No users found.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="px-4 py-3">
                  <SortButton
                    label="User"
                    field="name"
                    current={sort}
                    order={order}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortButton
                    label="Role"
                    field="role"
                    current={sort}
                    order={order}
                    onSort={handleSort}
                  />
                </th>
                <th className="hidden px-4 py-3 sm:table-cell">
                  <SortButton
                    label="Joined"
                    field="createdAt"
                    current={sort}
                    order={order}
                    onSort={handleSort}
                  />
                </th>
                <th className="hidden px-4 py-3 md:table-cell">Activity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-stone-50 last:border-b-0 hover:bg-stone-50/50"
                >
                  {/* User info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          (user.name?.[0] || user.email[0]).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stone-800">
                          {user.name || "—"}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Role badge */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  {/* Joined date */}
                  <td className="hidden px-4 py-3 text-stone-600 sm:table-cell">
                    {formatDate(user.createdAt)}
                  </td>
                  {/* Activity */}
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex gap-3 text-xs text-stone-500">
                      <span title="Reviews">{user._count.reviews} reviews</span>
                      <span title="Ratings">{user._count.ratings} ratings</span>
                      <span title="Saved">{user._count.savedRecipes} saved</span>
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        disabled={actionLoading === user.id}
                        className="rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                        title={
                          user.role === "admin"
                            ? "Demote to user"
                            : "Promote to admin"
                        }
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : user.role === "admin" ? (
                          "Demote"
                        ) : (
                          "Promote"
                        )}
                      </button>
                      {confirmDelete === user.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteUser(user.id)}
                            disabled={actionLoading === user.id}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          className="rounded-md border border-red-200 p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-stone-200 p-1.5 hover:bg-stone-50 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.pages}
              className="rounded-md border border-stone-200 p-1.5 hover:bg-stone-50 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-stone-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-stone-800">{value}</p>
    </div>
  );
}

function SortButton({
  label,
  field,
  current,
  order,
  onSort,
}: {
  label: string;
  field: string;
  current: string;
  order: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  return (
    <button
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-700"
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 ${current === field ? "text-amber-600" : ""}`}
      />
      {current === field && (
        <span className="text-amber-600">{order === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );
}

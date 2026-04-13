// src/components/admin/UserTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "../../components/ui/table";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "../../config/api";
import PaginationControls from "../../components/ui/PaginationControls";
import usePagination from "../../hooks/usePagination";

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/Admin/Users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setUsers(result.data || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load users", error);
      setUsers([]);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem("authToken");
    await fetch(`${API_BASE_URL}/Admin/Users/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchUsers();
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("authToken");
    await fetch(`${API_BASE_URL}/Admin/Users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    await fetchUsers();
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(query.toLowerCase()) ||
          u.lastName?.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase())
      ),
    [query, users]
  );

  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems: paginatedUsers,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredUsers, {
    initialPageSize: 10,
    resetDeps: [query],
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-500";
      case "pending_verification":
        return "text-amber-500";
      case "suspended":
        return "text-red-500";
      default:
        return theme === "dark" ? "text-gray-300" : "text-gray-700";
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="text-xl font-semibold">User Management</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or email"
              className="w-64"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>{user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className={getStatusColor(user.status)}>
                    {user.status || "active"}
                  </TableCell>
                  <TableCell className="space-x-2">
                    {user.status === "suspended" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(user.id, "active")}
                      >
                        Reactivate
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusChange(user.id, "suspended")}
                      >
                        Suspend
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 border-t pt-4">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
            itemLabel="users"
          />
        </div>
      </CardContent>
    </Card>
  );
}

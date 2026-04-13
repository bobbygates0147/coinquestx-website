import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { useTransactions } from "../../context/TransactionContext";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import PaginationControls from "../../components/ui/PaginationControls";
import PropTypes from "prop-types";
import {
  formatTransactionAmount,
  getAdjustmentDelta,
  getTransactionDestinationSummary,
  getTransactionTypeLabel,
} from "../../utils/transactionPresentation";

export default function AdminTransactions({
  defaultFilter = "Pending",
  transactionType,
  showAdminActions = false,
}) {
  const { theme } = useTheme();
  const {
    transactions,
    pendingRequests,
    pendingDeposits,
    pendingWithdrawals,
    approveTransaction,
    rejectTransaction,
    loading,
  } = useTransactions();

  const [filter, setFilter] = useState(defaultFilter);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let filtered = [];

    // First get the base set of transactions based on status filter
    if (filter === "Pending") {
      if (transactionType === "Deposit") {
        filtered = pendingDeposits;
      } else if (transactionType === "Withdrawal") {
        filtered = pendingWithdrawals;
      } else {
        filtered = pendingRequests;
      }
    } else if (filter === "All") {
      filtered = transactions;
    } else {
      filtered = transactions.filter((tx) => tx.status === filter);
    }

    // Then apply type filter if specified
    if (transactionType && filter !== "Pending") {
      filtered = filtered.filter((tx) => tx.type === transactionType);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setDisplayedTransactions(filtered);
  }, [
    filter,
    transactions,
    pendingRequests,
    pendingDeposits,
    pendingWithdrawals,
    transactionType,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, transactionType, displayedTransactions.length, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(displayedTransactions.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedTransactions.slice(start, start + pageSize);
  }, [displayedTransactions, currentPage, pageSize]);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await approveTransaction(id);
      toast.success("Transaction approved successfully");
    } catch (error) {
      toast.error("Failed to approve transaction: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessingId(id);
      await rejectTransaction(id);
      toast.success("Transaction rejected");
    } catch (error) {
      toast.error("Failed to reject transaction: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getAmountColor = (type) => {
    if (type === "Deposit") return "text-green-500";
    if (type === "Adjustment") return null;
    return "text-red-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={filter === "All" ? "default" : "secondary"}
          onClick={() => setFilter("All")}
          disabled={loading}
        >
          All
        </Button>
        <Button
          variant={filter === "Pending" ? "default" : "secondary"}
          onClick={() => setFilter("Pending")}
          disabled={loading}
        >
          Pending
        </Button>
        <Button
          variant={filter === "Completed" ? "default" : "secondary"}
          onClick={() => setFilter("Completed")}
          disabled={loading}
        >
          Completed
        </Button>
        <Button
          variant={filter === "Rejected" ? "default" : "secondary"}
          onClick={() => setFilter("Rejected")}
          disabled={loading}
        >
          Rejected
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={`border-b ${
                theme === "dark" ? "border-slate-700" : "border-gray-200"
              }`}
            >
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Method</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Status</th>
              {showAdminActions && <th className="text-left p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((tx) => {
              const destinationSummary =
                getTransactionDestinationSummary(tx) ||
                (tx.type === "Withdrawal" ? tx.details || "" : "");

              return (
              <tr
                key={tx.id}
                className={`border-b ${
                  theme === "dark"
                    ? "border-slate-800 hover:bg-slate-800"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{tx.userName || "N/A"}</span>
                    <span className="text-xs text-gray-500">
                      {tx.userEmail || ""}
                    </span>
                  </div>
                </td>
                <td className="p-3">{getTransactionTypeLabel(tx)}</td>
                <td
                  className={`p-3 font-medium ${
                    tx.type === "Adjustment"
                      ? getAdjustmentDelta(tx) < 0
                        ? "text-red-500"
                        : "text-green-500"
                      : getAmountColor(tx.type)
                  }`}
                >
                  {tx.type === "Adjustment"
                    ? formatTransactionAmount(tx)
                    : `${tx.type === "Withdrawal" ? "-" : "+"}$${tx.amount}`}
                </td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span>{tx.method || "N/A"}</span>
                    {destinationSummary && (
                      <span className="text-xs text-gray-500 break-words">
                        {destinationSummary}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">{formatDate(tx.date)}</td>
                <td
                  className={`p-3 ${
                    tx.status === "Completed"
                      ? "text-green-500"
                      : tx.status === "Pending"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {tx.status}
                </td>
                {showAdminActions && (
                  <td className="p-3">
                    {tx.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(tx.id)}
                          disabled={processingId === tx.id || loading}
                        >
                          {processingId === tx.id ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(tx.id)}
                          disabled={processingId === tx.id || loading}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>

        {displayedTransactions.length === 0 && (
          <div className="py-10 text-center">
            <p
              className={`text-lg ${
                theme === "dark" ? "text-slate-500" : "text-gray-500"
              }`}
            >
              No transactions found
            </p>
          </div>
        )}

        {displayedTransactions.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayedTransactions.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
            itemLabel="transactions"
          />
        )}
      </div>
    </div>
  );
}

AdminTransactions.propTypes = {
  defaultFilter: PropTypes.string,
  transactionType: PropTypes.string,
  showAdminActions: PropTypes.bool,
};

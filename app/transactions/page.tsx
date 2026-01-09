"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import FilterBar from "../components/filters/FilterBar";
import SummaryCard from "@/app/components/SummaryCard";
import { getStores, getStoreData } from "@/lib/api/stores";
import { useRouter } from "next/navigation";
import { Filter, X, ChevronRight, Store, Clock } from "lucide-react";

interface Store {
  id: string;
  name: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [filters, setFilters] = useState({
    date: "",
    store: "",
    status: "All Status",
    terminal: "",
    search: "",
  });

  const [stores, setStores] = useState<Store[]>([]);
  const [terminalOption, setTerminalOption] = useState<string[]>([]);
  // State ข้อมูลที่ดึงมาจาก API (Summary ของ API)
  const [apiSummary, setApiSummary] = useState({
    terminalsOnline: "0 / 0",
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // load user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      router.push("/login");
    }
  }, [router]);

  // load stores from role
  useEffect(() => {
    if (!currentUser) return;

    async function loadStores() {
      const allStores = await getStores();
      let authorizedStores: any[] = [];

      if (currentUser.role === "admin") {
        // Admin
        authorizedStores = allStores;
      } else {
        // User (branch ตัวเอง)
        const userBranches = currentUser.store_branches || [];
        authorizedStores = allStores.filter((s: any) =>
          userBranches.includes(s.id)
        );
      }

      setStores(authorizedStores);

      // Set Default Filter
      if (authorizedStores.length > 1) {
        setFilters((p) => ({ ...p, store: "All Branch" }));
      } else if (authorizedStores.length === 1) {
        setFilters((p) => ({ ...p, store: authorizedStores[0].id }));
      }
    }
    loadStores();
  }, [currentUser]);

  // Fetch Transactions (Aggregation Logic)
  useEffect(() => {
    if (!currentUser || !filters.store) return;

    async function fetchData() {
      setCurrentPage(1);

      let targetStoreIds: string[] = [];

      // Logic select ID
      if (filters.store === "All Branch") {
        if (currentUser.role === "admin") {
          const allStores = await getStores();
          targetStoreIds = allStores.map((s: any) => s.id);
        } else {
          targetStoreIds = currentUser.store_branches || [];
        }
      } else {
        targetStoreIds = [filters.store];
      }

      let combinedTransactions: any[] = [];
      let totalOnline = 0;
      let totalTerminals = 0;

      for (const id of targetStoreIds) {
        const res = await getStoreData(id);
        if (res) {
          const txList = (res.transactions || []).map((t: any) => ({
            ...t,
            store_id: t.store_id || id,
          }));
          combinedTransactions = [...combinedTransactions, ...txList];

          // รวม Terminal Counts
          const [on, tot] = (res.summary.terminalsOnline || "0 / 0")
            .split(" / ")
            .map(Number);
          totalOnline += on || 0;
          totalTerminals += tot || 0;
        }
      }

      combinedTransactions.sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
      );

      setTransactions(combinedTransactions);
      setApiSummary({
        terminalsOnline: `${totalOnline} / ${totalTerminals}`,
      });

      const uniqueTerminals = Array.from(
        new Set(combinedTransactions.map((t) => t.terminal_id))
      );
      setTerminalOption(["All Terminals", ...uniqueTerminals]);
    }

    fetchData();
  }, [filters.store, currentUser]);

  const filteredTransactions = transactions.filter((tx) => {
    let matches = true;

    // Search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      matches =
        matches &&
        (tx.transaction_id.toLowerCase().includes(searchTerm) ||
          (tx.merchant_id && tx.merchant_id.toLowerCase().includes(searchTerm)) ||
          (tx.store_id && tx.store_id.toLowerCase().includes(searchTerm)) ||
          tx.terminal_id.toLowerCase().includes(searchTerm) ||
          tx.status.toLowerCase().includes(searchTerm) ||
          tx.paymentMethod.toLowerCase().includes(searchTerm));
    }

    // Status
    if (filters.status && filters.status !== "All Status") {
      matches =
        matches && tx.status?.toLowerCase() === filters.status.toLowerCase();
    }

    // Terminal
    if (filters.terminal && filters.terminal !== "All Terminals") {
      matches = matches && tx.terminal_id === filters.terminal;
    }

    // Date
    if (filters.date) {
    }

    return matches;
  });

  // Calculate Summary from Filtered Data
  const successTx = filteredTransactions.filter((t) => t.status === "success");

  const filteredSummary = {
    totalAmount: successTx.reduce((sum, t) => sum + Number(t.amount), 0),
    successTransactions: successTx.length,
    totalTransactions: filteredTransactions.length,
    successRate: filteredTransactions.length
      ? +((successTx.length / filteredTransactions.length) * 100).toFixed(2)
      : 0,
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const maxPagesToShow = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  const displayPages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={`px-2 py-1 text-[10px] md:text-xs font-semibold rounded-full inline-block min-w-[60px] text-center
        ${
          status?.toLowerCase() === "success"
            ? "text-green-700 bg-green-100"
            : "text-red-700 bg-red-100"
        }`}
    >
      {status}
    </span>
  );

  return (
    <div className="space-y-6 mx-4 md:mx-8 pb-10 relative">
      {/* Header */}
      <Header title="Transaction" />

      {/* Filter Section */}
      <div className="w-full flex justify-end md:justify-between items-center mb-4">
        {/* 1. Desktop Filters (จอใหญ่) */}
        <div className="hidden md:flex flex-wrap gap-4 items-center w-full">
          <FilterBar
            showDate
            showStore
            showStatus
            showTerminal
            showSearch
            storeOptions={["All Branch", ...stores.map((s) => s.id)]}
            terminalOption={terminalOption}
            statusOptions={["All Status", "Success", "Failed"]}
            onDateChange={(v) => setFilters((p) => ({ ...p, date: v }))}
            onStoreChange={(v) => setFilters((p) => ({ ...p, store: v }))}
            onStatusChange={(v) => setFilters((p) => ({ ...p, status: v }))}
            onTerminalChange={(v) => setFilters((p) => ({ ...p, terminal: v }))}
            onSearchChange={(v) => setFilters((p) => ({ ...p, search: v }))}
            // ใส่ selectedStore เพื่อให้ Dropdown แสดงค่าถูกต้อง
            selectedStore={filters.store} 
          />
        </div>

        {/* 2. Mobile Filter Button (จอเล็ก) */}
        <button
          onClick={() => setShowMobileFilter(true)}
          className="md:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm active:scale-95 transition-all hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(filters.store !== "All Branch" ||
            filters.status !== "All Status" ||
            filters.search !== "") && (
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-0 right-0 -mt-1 -mr-1 animate-pulse" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden ${
          showMobileFilter
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setShowMobileFilter(false)}
      />

      {/* Drawer Content */}
      <div
        className={`fixed top-0 right-0 h-full w-[80%] max-w-[300px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          showMobileFilter ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowMobileFilter(false)}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Items */}
          <div className="flex-1 space-y-6 overflow-y-auto px-1">
            {/* 1. Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="w-full">
                <FilterBar
                  showSearch
                  isMobileStack={true}
                  onSearchChange={(v) =>
                    setFilters((p) => ({ ...p, search: v }))
                  }
                />
              </div>
            </div>

            {/* 2. Store */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Branch
              </label>
              <div className="w-full">
                <FilterBar
                  showStore
                  isMobileStack={true}
                  storeOptions={["All Branch", ...stores.map((s) => s.id)]}
                  onStoreChange={(v) => setFilters((p) => ({ ...p, store: v }))}
                  selectedStore={filters.store}
                />
              </div>
            </div>

            {/* ... Date, Terminal, Status Filters (เหมือนเดิม) ... */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <div className="w-full">
                <FilterBar
                  showDate
                  isMobileStack={true}
                  onDateChange={(v) => setFilters((p) => ({ ...p, date: v }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Terminal
              </label>
              <div className="w-full">
                <FilterBar
                  showTerminal
                  isMobileStack={true}
                  terminalOption={terminalOption}
                  onTerminalChange={(v) =>
                    setFilters((p) => ({ ...p, terminal: v }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="w-full">
                <FilterBar
                  showStatus
                  isMobileStack={true}
                  statusOptions={["All Status", "Success", "Failed"]}
                  onStatusChange={(v) =>
                    setFilters((p) => ({ ...p, status: v }))
                  }
                />
              </div>
            </div>
          </div>

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <SummaryCard
          title="Total Amount"
          value={filteredSummary.totalAmount}
          prefix="฿"
        />

        <SummaryCard
          title="Success Transactions"
          value={`${filteredSummary.successTransactions} / ${filteredSummary.totalTransactions}`}
        />

        <SummaryCard
          title="Success Rate"
          value={filteredSummary.successRate.toFixed(2)}
          suffix="%"
        />

        {/* ใช้ค่าจาก apiSummary ที่รวมมาแล้ว */}
        <SummaryCard title="Terminals Online" value={apiSummary.terminalsOnline} />
      </div>

      {/* Transactions View */}
      <div className="mt-6">
        {/* 1. Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full table-fixed">
            <thead className="bg-[#275066] text-white">
              <tr>
                <th className="p-3 w-[12%] text-center text-sm font-semibold">
                  Merchant ID
                </th>
                <th className="p-3 w-[10%] text-center text-sm font-semibold">
                  Branch
                </th>
                <th className="p-3 w-[16%] text-center text-sm font-semibold">
                  Transaction ID
                </th>
                <th className="p-3 w-[10%] text-center text-sm font-semibold">
                  Terminal
                </th>
                <th className="p-3 w-[12%] text-center text-sm font-semibold">
                  Payment
                </th>
                <th className="p-3 w-[10%] text-right text-sm font-semibold">
                  Amount
                </th>
                <th className="p-3 w-[16%] text-center text-sm font-semibold">
                  Status
                </th>
                <th className="p-3 w-[20%] text-center text-sm font-semibold">
                  Date & Time
                </th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {currentItems.length > 0 ? (
                currentItems.map((tx, index) => (
                  <tr
                    // ใช้ index ผสมเพื่อให้ key unique กรณี transaction id ซ้ำข้าม store (เผื่อไว้)
                    key={`${tx.transaction_id}-${index}`}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/transactions/${tx.transaction_id}`)
                    }
                  >
                    <td className="p-3 text-center truncate">
                      {tx.merchant_id || "-"}
                    </td>
                    <td className="p-3 text-center truncate">{tx.store_id}</td>
                    <td className="p-3 text-center truncate">
                      {tx.transaction_id}
                    </td>
                    <td className="p-3 text-center">{tx.terminal_id}</td>
                    <td className="p-3 text-center">{tx.paymentMethod}</td>
                    <td className="p-3 text-right">
                      ฿{Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="p-3 text-center text-sm text-gray-600">
                      {new Date(tx.datetime).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    No Transactions Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Mobile View (Card List) */}
        <div className="md:hidden space-y-3">
          {currentItems.length > 0 ? (
            currentItems.map((tx, index) => (
              <div
                key={`${tx.transaction_id}-${index}`}
                onClick={() =>
                  router.push(`/transactions/${tx.transaction_id}`)
                }
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 cursor-pointer"
              >
                {/* ID + Status */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">
                      #{tx.transaction_id}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-gray-500" />{" "}
                      <p className="font-semibold text-gray-800">
                        {tx.store_id || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>

                <div className="border-t border-gray-50 my-3"></div>

                {/* Detail + Amount */}
                <div className="flex justify-between items-end">
                  <div className="text-sm text-gray-500 space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="w-14 text-gray-400 text-xs">
                        Terminal:
                      </span>
                      {tx.terminal_id}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-14 text-gray-400 text-xs">
                        Payment:
                      </span>
                      {tx.paymentMethod}
                    </p>
                    
                    {/* Date Time Row */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                      <div className="w-5 flex justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      {new Date(tx.datetime).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      ฿{Number(tx.amount).toLocaleString()}
                    </p>
                    <div className="text-xs text-gray-400 flex items-center justify-end gap-1 mt-1">
                      Details <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
              No Transactions Found
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 text-sm text-gray-600 gap-4 md:gap-0">
        <span className="text-xs md:text-sm text-center md:text-left">
          Showing {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredTransactions.length)} of{" "}
          {filteredTransactions.length}
        </span>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 bg-white"
          >
            &lt;
          </button>

          {displayPages.map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => setCurrentPage(pageNumber)}
              className={`px-3 py-1 border rounded transition-colors ${
                currentPage === pageNumber
                  ? "bg-[#DDAD51] text-white border-[#DDAD51]"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {pageNumber}
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
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import FilterBar from "../components/filters/FilterBar";
import { getStores } from "@/lib/api/stores";
import { useRouter } from "next/navigation";
import { Filter, X, ChevronRight, Monitor, Box, Activity, Clock } from "lucide-react";

interface TerminalInfo {
  terminal_id: string;
  terminalStatus: "Online" | "Offline";
  storeId: string;
  model?: string;
  serial?: string;
  lastSeen?: string;
  lastTransaction?: string;
}

export default function TerminalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [filters, setFilters] = useState({
    status: "All",
    store: "",
    search: "",
  });

  const [allTerminals, setAllTerminals] = useState<TerminalInfo[]>([]);
  const [filteredTerminals, setFilteredTerminals] = useState<TerminalInfo[]>([]);
  const [storeOptions, setStoreOptions] = useState<string[]>([]);

  // load user from LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      router.push("/login");
    }
  }, [router]);

  // Load Data & Apply Permissions
  useEffect(() => {
    if (!currentUser) return;

    async function load() {
      const stores = await getStores();
      const terminalsMap = new Map<string, TerminalInfo>();
      const storeNames: string[] = [];
      let authorizedStores: any[] = [];

      if (currentUser.role === 'admin') {
         // Admin = all branch
         authorizedStores = stores;
      } else {
         // User = เฉพาะ branch ตัวเอง
         const userBranches = currentUser.store_branches || [];
         authorizedStores = stores.filter((s: any) => userBranches.includes(s.id));
      }

      authorizedStores.forEach((store: any) => {
        storeNames.push(store.id);
        (store.terminals || []).forEach((terminal: any) => {
          
          const txs = (store.transactions || [])
            .filter((tx: any) => tx.terminal_id === terminal.terminal_id)
            .sort(
              (a: any, b: any) =>
                new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
            );
          const lastTx = txs[0];

          terminalsMap.set(terminal.terminal_id, {
            terminal_id: terminal.terminal_id,
            storeId: store.id,
            terminalStatus: terminal.status === "online" ? "Online" : "Offline",
            model: terminal.model,
            serial: terminal.serial,
            lastSeen: terminal.lastSeen,
            lastTransaction: lastTx
              ? new Date(lastTx.datetime).toLocaleString()
              : "-",
          });
        });
      });

      const arr = Array.from(terminalsMap.values());
      setAllTerminals(arr);
      setFilteredTerminals(arr);
      
      if (storeNames.length > 1) {
        setStoreOptions(["All Branch", ...storeNames]);
        setFilters(prev => ({ ...prev, store: "All Branch" }));
      } else if (storeNames.length === 1) {
        setStoreOptions(storeNames);
        setFilters(prev => ({ ...prev, store: storeNames[0] }));
      } else {
        setStoreOptions([]);
      }
    }
    load();
  }, [currentUser]);

  // Client-Side Filter Logic
  useEffect(() => {
    let result = allTerminals;

    // Filter Status
    if (filters.status !== "All")
      result = result.filter((t) => t.terminalStatus === filters.status);
    
    // Filter Store
    if (filters.store && filters.store !== "All Branch") 
      result = result.filter((t) => t.storeId === filters.store);
    
    // Filter Search
    if (filters.search) {
      const lowerSearch = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.terminal_id.toLowerCase().includes(lowerSearch) ||
          (t.serial && t.serial.toLowerCase().includes(lowerSearch)) ||
          (t.model && t.model.toLowerCase().includes(lowerSearch)) ||
          (t.storeId && t.storeId.toLowerCase().includes(lowerSearch)) ||
          (t.terminalStatus && t.terminalStatus.toLowerCase().includes(lowerSearch))
      );
    }
    setFilteredTerminals(result);
  }, [filters, allTerminals]);

  // Component: Status Badge
  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={`px-2 py-1 text-[10px] md:text-xs font-semibold rounded-full inline-block min-w-[60px] text-center shadow-sm
        ${
          status === "Online"
            ? "text-green-700 bg-green-100 border border-green-200"
            : "text-red-700 bg-red-100 border border-red-200"
        }`}
    >
      {status}
    </span>
  );

  return (
    <div className="space-y-6 mx-4 md:mx-8 pb-10 relative">
      <Header title="Terminals" />

      {/* Top Bar (Filter & Counters) */}
      <div className="flex flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center order-2 md:order-1">
          {/* Desktop View */}
          <div className="hidden md:block">
            <FilterBar
              showSearch
              showStore
              showStatusOnline
              storeOptions={storeOptions}
              onSearchChange={(v) => setFilters((p) => ({ ...p, search: v }))}
              onStoreChange={(v) => setFilters((p) => ({ ...p, store: v }))}
              onStatusOnlineChange={(v) =>
                setFilters((p) => ({ ...p, status: v }))
              }
              selectedStore={filters.store}
            />
          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setShowMobileFilter(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm active:scale-95 transition-all hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filters.status !== "All" ||
              filters.store !== "All Branch" ||
              filters.search !== "") && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-0 right-0 -mt-1 -mr-1 animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-6 md:gap-10 order-1 md:order-2">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-semibold text-green-600">
              {filteredTerminals.filter((t) => t.terminalStatus === "Online").length}
            </span>
            <span className="text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wide">Online</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-2xl font-semibold text-red-500">
              {filteredTerminals.filter((t) => t.terminalStatus === "Offline").length}
            </span>
            <span className="text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wide">Offline</span>
          </div>
        </div>
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
              className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Store</label>
              <div className="w-full">
                <FilterBar
                  showStore
                  isMobileStack={true}
                  storeOptions={storeOptions}
                  onStoreChange={(v) => setFilters((p) => ({ ...p, store: v }))}
                  selectedStore={filters.store}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="w-full">
                <FilterBar
                  showStatusOnline
                  isMobileStack={true}
                  onStatusOnlineChange={(v) =>
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

      {/* Terminal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTerminals.map((t, index) => (
          <div
            key={`${t.terminal_id}-${index}`}
            className="group bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99] active:bg-gray-50 relative overflow-hidden"
            onClick={() => router.push(`/terminals/${t.terminal_id}`)}
          >
            {/* Header: ID & Status */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium mb-1 flex items-center gap-1">
                  <Monitor className="w-3 h-3" /> TERMINAL ID
                </span>
                <h2 className="text-lg font-bold text-gray-800 leading-tight">
                  {t.terminal_id}
                </h2>
                <span className="text-sm text-gray-600 mt-1 font-medium">
                  {t.storeId}
                </span>
              </div>
              <StatusBadge status={t.terminalStatus} />
            </div>

            <div className="border-t border-gray-50 my-3"></div>

            {/* Body: Specs */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
               {/* Model */}
               <div className="flex flex-col">
                 <span className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                   <Box className="w-3 h-3" /> Model
                 </span>
                 <span className="font-semibold text-gray-700">{t.model || "-"}</span>
               </div>
               
               {/* Serial */}
               <div className="flex flex-col">
                 <span className="text-xs text-gray-400 mb-0.5">Serial No.</span>
                 <span className="font-semibold text-gray-700 truncate" title={t.serial}>
                    {t.serial || "-"}
                 </span>
               </div>

               {/* Last Seen */}
               <div className="flex flex-col col-span-2">
                 <span className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                   <Activity className="w-3 h-3" /> Last Seen
                 </span>
                 <span className="font-medium text-gray-600 text-xs md:text-sm">
                   {t.lastSeen || "-"}
                 </span>
               </div>
            </div>

            {/* Footer: Last Tx & Action */}
            <div className="mt-4 pt-3 border-t border-dashed border-gray-100 flex justify-between items-end">
               <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> LAST TRANSACTION
                  </span>
                  <span className="text-sm font-bold text-gray-700">
                    {t.lastTransaction || "-"}
                  </span>
               </div>
               
               <div className="text-gray-300 group-hover:text-[#275066] group-hover:translate-x-1 transition-all duration-300">
                  <ChevronRight className="w-5 h-5" />
               </div>
            </div>

          </div>
        ))}

        {filteredTerminals.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Monitor className="w-12 h-12 mb-3 opacity-20" />
            <p>No terminals found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
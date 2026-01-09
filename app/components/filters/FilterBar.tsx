"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Store,
  Monitor,
  Search,
  List,
  ToggleLeft,
} from "lucide-react";

interface FilterBarProps {
  storeOptions?: string[];
  terminalOption?: string[];
  statusOptions?: string[];
  selectedStore?: string;

  showDate?: boolean;
  showStore?: boolean;
  showStatus?: boolean;
  showTerminal?: boolean;
  showSearch?: boolean;
  showDateQuick?: boolean;
  showStatusOnline?: boolean;
  isMobileStack?: boolean;

  onStoreChange?: (v: string) => void;
  onSearchChange?: (v: string) => void;
  onDateChange?: (v: string) => void;
  onStatusChange?: (v: string) => void;
  onTerminalChange?: (v: string) => void;
  onStatusOnlineChange?: (v: string) => void;
}

export default function FilterBar({
  storeOptions = [],
  terminalOption = [],
  statusOptions = [],
  showStore = false,
  showDate = false,
  showStatus = false,
  showTerminal = false,
  showSearch = false,
  showDateQuick = false,
  showStatusOnline = false,
  isMobileStack = false,
  selectedStore,

  onStoreChange,
  onSearchChange,
  onDateChange,
  onStatusChange,
  onTerminalChange,
  onStatusOnlineChange,
}: FilterBarProps) {
  
  const [filters, setFilters] = useState<{ date?: string }>({ date: "1D" });

  useEffect(() => {
  }, []);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === "date") onDateChange?.(value);
  };

  const containerClass = isMobileStack 
    ? "flex flex-col w-full gap-4" 
    : "flex flex-wrap items-center gap-6";

  const itemWidth = isMobileStack ? "w-full" : "w-[200px]";

  const dateQuickContainerClass = isMobileStack
    ? "flex w-full gap-2"
    : "flex gap-2 text-sm";
    
  const dateQuickButtonClass = (v: string) => `
    px-3 py-1 rounded-md border flex items-center justify-center transition text-sm
    ${isMobileStack ? "flex-1" : ""} 
    ${filters.date === v ? "text-white border-[#DDAD51] bg-[#DDAD51]" : "hover:bg-gray-100"}
  `;

  return (
    <div className={containerClass}>
      
      {/* Quick Date Buttons */}
      {showDateQuick && (
        <div className={dateQuickContainerClass}>
          {["1D", "7D", "30D"].map((v) => (
            <button
              key={v}
              onClick={() => updateFilter("date", v)}
              className={dateQuickButtonClass(v)}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Store Select */}
      {showStore && (
        <div className={`flex items-center gap-2 ${isMobileStack ? "w-full" : ""}`}>
          <Select 
            onValueChange={onStoreChange} 
            value={selectedStore}
          >
            <SelectTrigger className={itemWidth}>
              <div className="flex items-center gap-2 truncate">
                 <Store size={18} />
                 <SelectValue placeholder="All Branch" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {storeOptions.map((store, i) => (
                <SelectItem key={i} value={store}>
                  {store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date Input */}
      {showDate && (
        <div className={`relative ${isMobileStack ? "w-full" : ""}`}>
          <Calendar
            size={16}
            className="absolute left-2 top-2.5 text-gray-500"
          />
          <Input
            type="date"
            className={`pl-8 ${itemWidth}`}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => onDateChange?.(e.target.value)}
          />
        </div>
      )}

      {/* Status Select */}
      {showStatus && (
        <Select onValueChange={onStatusChange}>
          <SelectTrigger className={itemWidth}>
            <div className="flex items-center gap-2">
              <List size={18} />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Terminal Select */}
      {showTerminal && (
        <Select onValueChange={onTerminalChange}>
          <SelectTrigger className={itemWidth}>
            <div className="flex items-center gap-2">
              <Monitor size={18} />
              <SelectValue placeholder="Terminal" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {terminalOption?.map((t, i) => (
              <SelectItem key={i} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Status Online Select */}
      {showStatusOnline && (
        <Select onValueChange={onStatusOnlineChange}>
          <SelectTrigger className={itemWidth}>
             <div className="flex items-center gap-2">
               <ToggleLeft size={18} />
               <SelectValue placeholder="All Status" />
             </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Online">Online</SelectItem>
            <SelectItem value="Offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Search Input */}
      {showSearch && (
        <div className={`relative ${isMobileStack ? "w-full" : ""}`}>
          <Search size={16} className="absolute left-2 top-2.5 text-gray-500" />
          <Input
            placeholder="Search..."
            className={`pl-8 ${itemWidth}`}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
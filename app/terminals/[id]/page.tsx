"use client";

import { useEffect, useState } from "react";
import { getStores } from "@/lib/api/stores";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronRight, 
  ArrowLeft,
  Monitor,
  Store,
  Hash,
  Signal,
  Clock,
  Cpu,
  Box,
  Activity
} from "lucide-react";
import Header from "@/app/components/Header";

export default function TerminalDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const terminalId = id as string;

  const [terminal, setTerminal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const stores = await getStores();
      let found = false;

      for (const store of stores) {
        const matchTerminal = (store.terminals || []).find(
          (t: any) => t.terminal_id === terminalId
        );

        if (!matchTerminal) continue;

        const txs = (store.transactions || [])
          .filter((tx: any) => tx.terminal_id === terminalId)
          .sort(
            (a: any, b: any) =>
              new Date(b.datetime).getTime() -
              new Date(a.datetime).getTime()
          );

        const lastTx = txs[0];

        setTerminal({
          terminal_id: terminalId,
          storeId: store.id,
          terminalStatus:
            matchTerminal.status === "online" ? "Online" : "Offline",
          model: matchTerminal.model,
          serial: matchTerminal.serial,
          lastSeen: matchTerminal.lastSeen,
          lastTransaction: lastTx
            ? new Date(lastTx.datetime).toLocaleString()
            : "-",
        });
        found = true;
        break;
      }
      setLoading(false);
    }

    load();
  }, [terminalId]);

  if (loading) {
    return (
      <div className="flex h-64 justify-center items-center text-gray-400 animate-pulse">
        Loading Terminal Details...
      </div>
    );
  }

  if (!terminal) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Terminal not found.</p>
        <button 
          onClick={() => router.back()}
          className="mt-4 text-[#275066] underline"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  const isOnline = terminal.terminalStatus === "Online";
  const DetailItem = ({ icon: Icon, label, value, highlight = false }: any) => (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
      <div className="p-2 bg-white rounded-full shadow-sm text-gray-500">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`font-semibold ${highlight ? "text-[#275066]" : "text-gray-800"}`}>
          {value || "-"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mx-4 md:mx-8 pb-10">
      <Header title="Terminal Details" />

      {/* Breadcrumb*/}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <button 
            onClick={() => router.push("/terminals")}
            className="hover:text-[#275066] hover:underline transition-colors"
          >
            Terminals
          </button>
          <ChevronRight size={14} />
          <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
            {terminal.terminal_id}
          </span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Card Header (Hero Section) */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[#275066]/10 rounded-2xl flex items-center justify-center text-[#275066]">
              <Monitor size={32} />
            </div>
            <div>
               <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                 {terminal.terminal_id}
               </h1>
               <div className="flex items-center gap-2 text-gray-500 text-sm">
                 <Box size={14} />
                 <span>Model: <span className="font-semibold text-gray-700">{terminal.model || "Unknown"}</span></span>
               </div>
            </div>
          </div>

          <div className={`px-4 py-2 rounded-full flex items-center gap-2 border shadow-sm
            ${isOnline 
              ? "bg-green-100 text-green-700 border-green-200" 
              : "bg-red-100 text-red-700 border-red-200"
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="font-bold text-sm tracking-wide">
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Card Body (Details Grid) */}
        <div className="p-6 md:p-8">
           <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
             Device Information
           </h3>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Store Location */}
              <DetailItem 
                icon={Store}
                label="Branch Location"
                value={terminal.storeId}
              />

              {/* Serial Number */}
              <DetailItem 
                icon={Hash}
                label="Serial Number"
                value={terminal.serial}
              />

              {/* Last Seen */}
              <DetailItem 
                icon={Activity}
                label="Last Seen"
                value={terminal.lastSeen}
              />

              {/* Last Transaction */}
              <DetailItem 
                icon={Clock}
                label="Last Transaction"
                value={terminal.lastTransaction}
              />
           </div>
        </div>

        {/* Card Footer (Optional Actions) */}
        <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
           <button 
             className="text-sm text-[#275066] font-medium hover:underline flex items-center gap-1"
             onClick={() => router.push(`/transactions?terminal=${terminal.terminal_id}`)}
           >
             View Transaction History <ChevronRight size={14} />
           </button>
        </div>

      </div>
    </div>
  );
}
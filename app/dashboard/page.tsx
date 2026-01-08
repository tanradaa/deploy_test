"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "../components/Header";
import FilterBar from "../components/filters/FilterBar";
import SummaryCard from "@/app/components/SummaryCard";
import { getStores, getStoreData } from "@/lib/api/stores";
import { Filter, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [range, setRange] = useState("1D");
  const [store, setStore] = useState<string>("All Stores");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const router = useRouter();

  const [stores, setStores] = useState<string[]>([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    successTransactions: 0,
    totalTransactions: 0,
    successRate: 0,
    terminalsOnline: "0 / 0",
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentList, setRecentList] = useState<any[]>([]);

  useEffect(() => {
    getStores().then((res) => {
      const names = res
        .map((s: any) => s.id)
        .filter((id: string) => id.toLowerCase() !== "all-stores");
      setStores(["All Branch", ...names]);
    });
  }, []);

  useEffect(() => {
    getStoreData(store).then((res) => {
      if (!res) return;
      setSummary(res.summary);
      setRecentList(
        (res.transactions || [])
          .sort(
            (a: any, b: any) =>
              new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
          )
          .slice(0, 10)
      );
      setChartData(
        range === "1D"
          ? res.hourly || []
          : (res.daily || []).slice(0, range === "7D" ? 7 : 30)
      );
    });
  }, [store, range]);

  return (
    <div className="space-y-6 mx-4 md:mx-8 pb-10 relative">
      <Header title="Dashboard" />

      {/* Filter Section */}
      <div className="w-full flex justify-end md:justify-between items-center mb-4">
        {/* Desktop Filters (จอใหญ่ md:flex) */}
        <div className="hidden md:flex justify-between items-center w-full gap-4">
          <FilterBar showStore storeOptions={stores} onStoreChange={setStore} />
          <FilterBar showDateQuick onDateChange={setRange} />
        </div>

        {/* Mobile Filter Button (จอเล็ก md:hidden) */}
        <button
          onClick={() => setShowMobileFilter(true)}
          className="md:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm active:scale-95 transition-all"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(store !== "All Stores" || range !== "1D") && (
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

      {/* Sidebar Content (เลื่อนจากขวา) */}
      <div
        className={`fixed top-0 right-0 h-full w-[80%] max-w-[300px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          showMobileFilter ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 h-full flex flex-col">
          {/* Header ของ Sidebar */}
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
          <div className="flex-1 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Branch
              </label>
              <div className="w-full">
                <FilterBar
                  showStore
                  storeOptions={stores}
                  onStoreChange={setStore}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Date Range
              </label>
              <div className="w-full">
                <FilterBar showDateQuick onDateChange={setRange} />
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t">
            <button
              onClick={() => setShowMobileFilter(false)}
              className="w-full py-3 bg-[#275066] text-white rounded-lg font-medium active:scale-95 transition-transform"
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
          value={summary.totalAmount}
          prefix="฿"
        />
        <SummaryCard
          title="Success Transactions"
          value={`${summary.successTransactions} / ${summary.totalTransactions}`}
        />

        <SummaryCard
          title="Success Rate"
          value={summary.successRate.toFixed(2)}
          suffix="%"
        />
        <SummaryCard title="Terminals Online" value={summary.terminalsOnline} />
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trends ({range})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#30627d"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm h-80 overflow-y-auto pr-2">
              {recentList.map((t: any) => (
                <div
                  key={t.transaction_id}
                  onClick={() => router.push(`/transactions/${t.transaction_id}`)}
                  className="flex justify-between pb-3 border-b cursor-pointer hover:bg-gray-50 transition-colors p-2 rounded-mds"
                >
                  <div>
                    <p className="font-medium">{t.transaction_id}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(t.datetime).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ฿{Number(t.amount).toLocaleString()}
                    </p>
                    <p
                      className={`text-xs ${
                        t.status === "success"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {t.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

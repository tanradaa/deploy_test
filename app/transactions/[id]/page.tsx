"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Download } from "lucide-react";
import Header from "@/app/components/Header";
import { getStores, getStoreData } from "@/lib/api/stores";

function exportTransactionCSV(transaction: any) {
  const rows = [
    ["Field", "Value"],
    ["Transaction ID", transaction.transaction_id],
    ["Status", transaction.status],
    ["Amount", transaction.amount],
    ["Currency", "THB"],
    ["Payment Method", transaction.paymentMethod],
    ["Authorization ID", transaction.auth_id || "-"],
    ["Provider", transaction.provider || "-"],
    ["Merchant ID", transaction.merchant_id],
    ["Store ID", transaction.storeId],
    ["Store Name", transaction.storeName],
    ["Terminal ID", transaction.terminal_id],
    ["Terminal Model", transaction.terminal_model],
    ["Terminal Serial", transaction.terminal_serial],
    ["Date Time", new Date(transaction.datetime).toLocaleString()],
  ];

  const csvContent = rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `transaction_${transaction.transaction_id}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

type Role = "admin" | "manager" | "viewer";

export default function TransactionDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const transaction_id = id as string;

  const [transaction, setTransaction] = useState<any>(null);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    async function load() {
      // load role
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setRole(user.role);
      }

      // load transaction
      const stores = await getStores();

      if (!Array.isArray(stores)) return;

      for (const store of stores) {
        const storeData = await getStoreData(store.id);

        const match = storeData.transactions?.find(
          (tx: any) => tx.transaction_id === transaction_id
        );

        if (!match) continue;

        const terminal = storeData.terminals?.find(
          (t: any) => t.terminal_id === match.terminal_id
        );

        setTransaction({
          ...match,
          storeId: store.id,
          storeName: store.name,
          merchant_id: store.merchant_id,
          terminal_model: terminal?.model ?? "-",
          terminal_serial: terminal?.serial ?? "-",
          terminal_status: terminal?.status ?? "-",
          terminal_lastSeen: terminal?.lastSeen ?? "-",
        });

        break;
      }
    }

    load();
  }, [transaction_id]);

  if (!transaction) {
    return (
      <div className="flex justify-center items-center h-80 text-gray-500">
        Loading transaction...
      </div>
    );
  }

  const isSuccess = transaction.status?.toLowerCase() === "success";

  return (
    <div className="space-y-6 mx-8">
      <Header title="Transaction Detail" />

      {/* Header Row */}
      <div className="flex items-center justify-between mt-4">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span
            onClick={() => router.push("/transactions")}
            className="cursor-pointer hover:underline hover:text-gray-700 transition"
          >
            Transactions
          </span>
          <ChevronRight size={16} />
          <span className="font-semibold text-gray-700">
            {transaction.transaction_id}
          </span>
        </div>

        {/* Export Button */}
        {(role === "admin" || role === "manager") && (
          <button
            onClick={() => exportTransactionCSV(transaction)}
            className="flex items-center gap-2 px-4 py-2 bg-[#275066] text-white font-semibold rounded-lg
      transition-all duration-300 shadow-sm
      hover:shadow-md hover:-translate-y-[1px] hover:bg-[#1f3b4d]
      active:translate-y-[1px]"
          >
            <Download size={18} />
            <span className="text-sm">Export</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT */}
        <div className="space-y-8">
          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Information</h3>

            <div className="bg-[#F8FAFC] rounded-xl p-6 space-y-4">
              <InfoRow
                label="Payment Method"
                value={transaction.paymentMethod}
              />
              <InfoRow
                label="Authorization ID"
                value={transaction.auth_id || "-"}
              />
              <InfoRow label="Merchant ID" value={transaction.merchant_id} />
              <InfoRow label="Provider" value={transaction.provider || "-"} />
            </div>
          </div>

          {/* Terminal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Terminal Information</h3>

            <div className="bg-[#F8FAFC] rounded-xl p-6 space-y-4">
              <InfoRow label="Terminal ID" value={transaction.terminal_id} />
              <InfoRow
                label="Serial Number"
                value={transaction.terminal_serial}
              />
              <InfoRow label="Branch Location" value={transaction.storeId} />
              <InfoRow
                label="Device Model"
                value={transaction.terminal_model}
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <h3 className="text-lg font-semibold mb-6">Transaction Timeline</h3>

          <div className="space-y-6">
            <TimelineItem
              title="Transaction Initiated"
              time={new Date(transaction.datetime).toLocaleString()}
              success
            />
            <TimelineItem
              title={isSuccess ? "Payment Approved" : "Payment Failed"}
              time={new Date(transaction.datetime).toLocaleString()}
              success={isSuccess}
            />
          </div>

          <div className="my-20 border-t" />

          <div className="flex items-center justify-between">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium
                ${
                  isSuccess
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
            >
              {isSuccess ? "Success" : "Failed"}
            </span>

            <span className="text-3xl font-bold">
              ฿{Number(transaction.amount).toLocaleString()}
            </span>
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Processing Time</span>
              <span>2.3 seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Response Code</span>
              <span className="text-green-600">00 - Approved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function TimelineItem({
  title,
  time,
  success,
}: {
  title: string;
  time?: string;
  success?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className={`mt-1 h-3 w-3 rounded-full ${
          success ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
    </div>
  );
}

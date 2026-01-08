"use client";

import { Bell, Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getStores } from "@/lib/api/stores";

type Transaction = {
  transaction_id: string;
  paymentMethod: string;
  amount: number;
  status: "success" | "failed";
  datetime: string;
};

type Store = {
  id: string;
  name: string;
  transactions: Transaction[];
};

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  href: string;
  type: "success" | "error";
};

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function Header({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const buildNotifications = (stores: Store[]): Notification[] => {
    return stores.flatMap((store) =>
      store.transactions.map((tx) => ({
        id: tx.transaction_id,
        title: tx.status === "success" ? "Payment Success!" : "Payment Failed",
        message: `ID: ${tx.transaction_id}
Branch: ${store.id}
Amount: ฿${Number(tx.amount).toLocaleString()}`,
        time: new Date(tx.datetime).toLocaleString(),
        href: `/transactions/${tx.transaction_id}`,
        type: tx.status === "success" ? "success" : "error",
      }))
    );
  };

  const loadNotifications = debounce(async () => {
    const stores: Store[] = await getStores();
    const noti = buildNotifications(stores);

    noti.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    setNotifications(noti);
  }, 500);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayed = showAll ? notifications : notifications.slice(0, 3);

  return (
    <div className="flex justify-between items-center mb-6 relative z-50">
      <h1 className="text-2xl md:text-3xl font-bold truncate pr-2">{title}</h1>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-6 h-6 md:w-7 md:h-7 cursor-pointer text-gray-700" />
          
          {notifications.length > 0 && (
            <span className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center border-2 border-white shadow-sm">
              {notifications.length > 99 ? "99+" : notifications.length}
            </span>
          )}
        </button>

        {open && (
          <>
            {/* Mobile Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />

            <div
              className={`
                /* Mobile Styles: Fixed Center */
                fixed top-20 left-1/2 -translate-x-1/2 
                w-[90vw] max-w-sm 
                z-50
                
                /* Desktop Styles: Absolute Right */
                md:absolute md:top-full md:right-0 md:left-auto md:translate-x-0 md:mt-2
                md:w-[380px] md:max-w-none

                /* Common Styles */
                bg-white shadow-2xl rounded-xl border border-gray-100
                flex flex-col max-h-[70vh]
                animate-in fade-in zoom-in-95 origin-top
              `}
            >
              {/* Header Dropdown */}
              <div className="p-3 md:p-4 font-semibold border-b bg-gray-50/50 rounded-t-xl shrink-0 flex justify-between items-center">
                {/* Left: Title + Badge */}
                <div className="flex items-center gap-2">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <span className="text-xs font-normal text-gray-500 bg-white border px-2 py-0.5 rounded-full">
                      {notifications.length} New
                    </span>
                  )}
                </div>

                {/* Right: Close Button */}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 -mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 overflow-y-auto custom-scrollbar space-y-2">
                {displayed.length > 0 ? (
                  displayed.map((n) => {
                    const isSuccess = n.type === "success";

                    return (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className={`
                          block p-3 rounded-lg border transition-all active:scale-[0.98]
                          ${
                            isSuccess
                              ? "border-green-100 bg-white hover:bg-green-50/30"
                              : "border-red-100 bg-white hover:bg-red-50/30"
                          }
                        `}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`
                              w-10 h-10 flex items-center justify-center shrink-0
                              rounded-full shadow-sm mt-1
                              ${
                                isSuccess
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                              }
                            `}
                          >
                            {isSuccess ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <X className="w-5 h-5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-gray-800 truncate pr-2">
                                {n.title}
                              </p>
                              <p className="text-[10px] text-gray-400 whitespace-nowrap">
                                {n.time.split(" ")[1]}
                              </p>
                            </div>

                            <p className="text-xs text-gray-600 whitespace-pre-line mt-1 leading-relaxed line-clamp-2">
                              {n.message}
                            </p>

                            <p className="text-[10px] text-gray-400 mt-2 text-right">
                              {n.time}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No notifications
                  </div>
                )}
              </div>

              {/* Footer Button */}
              {notifications.length > 1 && (
                <div className="border-t p-2 shrink-0 bg-gray-50/50 rounded-b-xl">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-2 text-xs md:text-sm font-medium text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                  >
                    {showAll
                      ? "Show less"
                      : `View all (${notifications.length})`}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

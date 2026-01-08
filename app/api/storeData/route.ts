import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") || "All Stores";

  try {
    const res = await fetch(
      "https://693691f2f8dc350aff31551d.mockapi.io/api/v1/stores",
      { cache: "no-store" }
    );

    if (!res.ok)
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });

    const stores = await res.json();

    // เลือก store
    const isAll = storeId === "All Stores";
    const selectedStores = isAll
      ? stores
      : stores.filter((s: any) => s.id === storeId);

    // รวม transactions
    const allTx = selectedStores.flatMap((s: any) =>
      (s.transactions || []).map((t: any) => ({
        ...t,
        merchant_id: s.merchant_id,
        store_id: s.id,
        store_name: s.name,
      }))
    );

    const successTx = allTx.filter((t: any) => t.status === "success");

    // Summary
    const totalAmount = successTx.reduce(
      (sum: number, t: any) => sum + Number(t.amount),
      0
    );

    const successCount = successTx.length;
    const totalCount = allTx.length;

    const successRate = allTx.length
      ? +((successTx.length / allTx.length) * 100).toFixed(2)
      : 0;

    // terminals
    const allTerminals = selectedStores.flatMap((s: any) => s.terminals || []);

    const onlineCount = allTerminals.filter(
      (t: any) => t.status === "online"
    ).length;

    const terminalsOnline = `${onlineCount} / ${allTerminals.length}`;

    // Daily chart
    const daily = Object.values(
      successTx.reduce((acc: any, t: any) => {
        const day = t.datetime.substring(0, 10); // "2025-12-01"
        acc[day] = acc[day] || { name: day, amount: 0 };
        acc[day].amount += Number(t.amount);
        return acc;
      }, {})
    );

    // Hourly (mock)
    const hourly = Object.values(
      successTx.reduce((acc: any, t: any) => {
        const hour = t.datetime.substring(11, 13); // "00"
        const key = `${hour}:00`;

        acc[key] = acc[key] || { name: key, amount: 0 };
        acc[key].amount += Number(t.amount);
        return acc;
      }, {})
    ).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({
      summary: {
        totalAmount,
        successTransactions: successCount,
        totalTransactions: totalCount,
        successRate,
        terminalsOnline,
      },
      terminals: allTerminals, 
      transactions: allTx.sort(
        (a: any, b: any) =>
          new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
      ),
      daily,
      hourly,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", detail: err },
      { status: 500 }
    );
  }
}

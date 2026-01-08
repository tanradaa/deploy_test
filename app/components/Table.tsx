import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column {
    key: string;
    label: string;
    width: string;
}

interface TableProps {
    columns: Column[];
    data: Record<string, any>[];
}

export default function CustomTable({ columns, data }: TableProps) {
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border">
      <Table className="table-auto w-full border-collapse">
        <TableHeader className="bg-[#275066] [&_th]:text-white [&_tr:hover]:bg-transparent">
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} style={{ width: col.width }}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr:hover]:bg-gray-50 transition">
          {data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.key === "id" ? "font-medium" : ""}>
                  {row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
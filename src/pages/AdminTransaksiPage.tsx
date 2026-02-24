import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export default function AdminTransaksiPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Transaksi
        </CardTitle>
        <CardDescription>Fitur ini akan datang.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Konten transaksi akan ditambahkan di versi mendatang.</p>
      </CardContent>
    </Card>
  );
}

// [client/src/pages/report.tsx] - Version 1.0 - Page de rapport des coûts par discipline
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { getDisciplineReport } from '../lib/api-client';
import { useBudgetCalculator } from '../hooks/useBudgetCalculator';

export default function ReportPage() {
  const { formatCurrency } = useBudgetCalculator();

  const reportQuery = useQuery({
    queryKey: ['disciplineReport'],
    queryFn: getDisciplineReport,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-foreground/10 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Rapport Annuel par Discipline</h1>
              <p className="text-primary-foreground/80 mt-1">Coûts totaux agrégés de tous les modèles de budget.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-xl font-semibold text-primary">
              Résumé des Coûts
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au Calculateur
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {reportQuery.isLoading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Chargement du rapport...</span>
              </div>
            )}
            {reportQuery.isError && (
              <div className="flex flex-col items-center justify-center py-12 text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Erreur lors du chargement des données.</p>
                <p className="text-sm">Veuillez réessayer plus tard.</p>
              </div>
            )}
            {reportQuery.isSuccess && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70%]">Discipline</TableHead>
                    <TableHead className="text-right">Coût Total Annuel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportQuery.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                        Aucun modèle de budget trouvé pour générer un rapport.
                      </TableCell>
                    </TableRow>
                  )}
                  {reportQuery.data
                    .sort((a, b) => b.totalCost - a.totalCost) // Trier par coût décroissant
                    .map(({ discipline, totalCost }) => (
                      <TableRow key={discipline}>
                        <TableCell className="font-medium">{discipline}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(totalCost)}
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
// [client/src/pages/report.tsx] - Version 3.0 - Ventilation des salaires, formatage entier et layout élargi
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { getDetailedReport } from '../lib/api-client';
import { useBudgetCalculator } from '../hooks/useBudgetCalculator';
import type { DetailedReportLine } from '@shared/schema';

type ProcessedReportData = {
  grouped: Record<string, DetailedReportLine[]>;
  disciplineTotals: Record<string, DetailedReportLine>;
  grandTotal: DetailedReportLine;
};

// Initialisateur mis à jour pour correspondre à la nouvelle structure de DetailedReportLine.
const zeroedReportLine: Omit<DetailedReportLine, "modelId" | "discipline" | "gender" | "category" | "level"> = {
  numberOfTeams: 0,
  costSeasonHeadCoach: 0,
  costSeasonAssistantCoach: 0,
  tournamentBonus: 0,
  transportationFee: 0,
  federationFee: 0,
  subTotalRegularSeason: 0,
  costPlayoffsHeadCoach: 0,
  costPlayoffsAssistantCoach: 0,
  subTotalPlayoffs: 0,
  grandTotal: 0,
};

export default function ReportPage() {
  const { formatCurrency } = useBudgetCalculator();

  const reportQuery = useQuery({
    queryKey: ['detailedReport'],
    queryFn: getDetailedReport,
  });

  const processedData = useMemo<ProcessedReportData | null>(() => {
    if (!reportQuery.data) return null;

    const grouped = reportQuery.data.reduce((acc, line) => {
      (acc[line.discipline] = acc[line.discipline] || []).push(line);
      return acc;
    }, {} as Record<string, DetailedReportLine[]>);

    const disciplineTotals: Record<string, DetailedReportLine> = {};
    for (const discipline in grouped) {
      disciplineTotals[discipline] = grouped[discipline].reduce(
        (total, line) => {
          Object.keys(total).forEach(key => {
            (total as any)[key] += (line as any)[key];
          });
          return total;
        },
        {...zeroedReportLine} as any,
      );
    }

    const grandTotal = Object.values(disciplineTotals).reduce(
      (total, disciplineTotal) => {
        Object.keys(total).forEach(key => {
          (total as any)[key] += (disciplineTotal as any)[key];
        });
        return total;
      },
      {...zeroedReportLine} as any,
    );

    return { grouped, disciplineTotals, grandTotal };
  }, [reportQuery.data]);

  // En-têtes mis à jour pour refléter la ventilation des salaires.
  const tableHeaders = [
    "Sexe", "Cat.", "Niv.",
    "Salaire Chef Saison", "Salaire Adj. Saison", "Tournoi", "Transport", "Fédération", "Sous-Total Saison",
    "Salaire Chef Séries", "Salaire Adj. Séries", "Sous-Total Séries",
    "Total Modèle"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Conteneur élargi à max-w-screen-2xl */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-foreground/10 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Rapport Financier Détaillé</h1>
              <p className="text-primary-foreground/80 mt-1">Analyse des coûts par modèle, groupés par discipline.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteneur élargi à max-w-screen-2xl */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-xl font-semibold text-primary">
              Résumé Financier
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au Calculateur
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-2 md:p-6">
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
            {reportQuery.isSuccess && processedData && (
              <div className="overflow-x-auto">
                <Table className="min-w-full text-sm">
                  <TableHeader>
                    <TableRow>
                      {tableHeaders.map(header => <TableHead key={header} className={["Sexe", "Cat.", "Niv."].includes(header) ? "w-[80px]" : "text-right"}>{header}</TableHead>)}
                    </TableRow>
                  </TableHeader>

                  {Object.keys(processedData.grouped).length === 0 ? (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={tableHeaders.length} className="text-center text-muted-foreground py-8">
                          Aucun modèle de budget trouvé pour générer un rapport.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  ) : (
                    <>
                      {Object.entries(processedData.grouped).map(([discipline, models]) => (
                        <TableBody key={discipline}>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={tableHeaders.length} className="font-bold text-lg text-primary">
                              {discipline}
                            </TableCell>
                          </TableRow>

                          {models.map(model => (
                            <TableRow key={model.modelId}>
                              <TableCell>{model.gender}</TableCell>
                              <TableCell>{model.category}</TableCell>
                              <TableCell>{model.level}</TableCell>
                              {/* Liaison des nouvelles données de salaire */}
                              <TableCell className="text-right font-mono">{formatCurrency(model.costSeasonHeadCoach)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(model.costSeasonAssistantCoach)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(model.tournamentBonus)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(model.transportationFee)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(model.federationFee)}</TableCell>
                              <TableCell className="text-right font-mono font-semibold bg-secondary/30">{formatCurrency(model.subTotalRegularSeason)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(model.costPlayoffsHeadCoach)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(model.costPlayoffsAssistantCoach)}</TableCell>
                              <TableCell className="text-right font-mono font-semibold bg-secondary/30">{formatCurrency(model.subTotalPlayoffs)}</TableCell>
                              <TableCell className="text-right font-mono font-bold text-base bg-secondary">{formatCurrency(model.grandTotal)}</TableCell>
                            </TableRow>
                          ))}

                          <TableRow className="bg-muted hover:bg-muted">
                            <TableCell colSpan={3} className="text-right font-bold text-base">Sous-Total {discipline}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-base">{formatCurrency(processedData.disciplineTotals[discipline].costSeasonHeadCoach)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-base">{formatCurrency(processedData.disciplineTotals[discipline].costSeasonAssistantCoach)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-base">{formatCurrency(processedData.disciplineTotals[discipline].tournamentBonus)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-base">{formatCurrency(processedData.disciplineTotals[discipline].transportationFee)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-base">{formatCurrency(processedData.disciplineTotals[discipline].federationFee)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-base bg-secondary/50">{formatCurrency(processedData.disciplineTotals[discipline].subTotalRegularSeason)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-base">{formatCurrency(processedData.disciplineTotals[discipline].costPlayoffsHeadCoach)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-base">{formatCurrency(processedData.disciplineTotals[discipline].costPlayoffsAssistantCoach)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-base bg-secondary/50">{formatCurrency(processedData.disciplineTotals[discipline].subTotalPlayoffs)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-lg bg-secondary">{formatCurrency(processedData.disciplineTotals[discipline].grandTotal)}</TableCell>
                          </TableRow>
                        </TableBody>
                      ))}

                      <TableFooter className="bg-primary text-primary-foreground">
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-extrabold text-xl">GRAND TOTAL</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-base">{formatCurrency(processedData.grandTotal.costSeasonHeadCoach)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-base">{formatCurrency(processedData.grandTotal.costSeasonAssistantCoach)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-base">{formatCurrency(processedData.grandTotal.tournamentBonus)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-base">{formatCurrency(processedData.grandTotal.transportationFee)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-base">{formatCurrency(processedData.grandTotal.federationFee)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-base">{formatCurrency(processedData.grandTotal.subTotalRegularSeason)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-base">{formatCurrency(processedData.grandTotal.costPlayoffsHeadCoach)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-base">{formatCurrency(processedData.grandTotal.costPlayoffsAssistantCoach)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-base">{formatCurrency(processedData.grandTotal.subTotalPlayoffs)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-xl">{formatCurrency(processedData.grandTotal.grandTotal)}</TableCell>
                        </TableRow>
                      </TableFooter>
                    </>
                  )}
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
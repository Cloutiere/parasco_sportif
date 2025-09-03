import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, BarChart3, Calculator, PlusCircle, Trash2, FileText, Calendar } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'wouter';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

import { useBudgetCalculator } from '../hooks/useBudgetCalculator';
import { createBudgetModel, deleteBudgetModel, getBudgetModels } from '../lib/api-client';
import type { BudgetModel, InsertBudgetModel } from '@shared/schema';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

export default function Home() {
  const queryClient = useQueryClient();
  const [modelName, setModelName] = useState('');
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { formData, results, handleInputChange, formatCurrency, setFormData, resetForm } =
    useBudgetCalculator();

  const {
    data: models,
    isLoading: isLoadingModels,
    isError: isErrorModels,
  } = useQuery({
    queryKey: ['budgetModels'],
    queryFn: getBudgetModels,
  });

  const createModelMutation = useMutation({
    mutationFn: createBudgetModel,
    onSuccess: (newModel) => {
      toast.success(`Modèle "${newModel.name}" créé avec succès !`);
      queryClient.invalidateQueries({ queryKey: ['budgetModels'] });
      setModelName('');
    },
    onError: () => {
      toast.error('Erreur lors de la création du modèle.');
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: deleteBudgetModel,
    onSuccess: () => {
      toast.success('Modèle supprimé avec succès.');
      queryClient.invalidateQueries({ queryKey: ['budgetModels'] });
      resetForm();
      setLoadedModelId(null);
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du modèle.');
    },
  });

  const handleSaveModel = () => {
    if (!modelName.trim()) {
      toast.warning('Veuillez donner un nom au modèle.');
      return;
    }
    const modelData: InsertBudgetModel = {
      name: modelName.trim(),
      numberOfTeams: 1,
      ...formData,
      seasonStartDate: formData.seasonStartDate?.toISOString() || null,
      seasonEndDate: formData.seasonEndDate?.toISOString() || null,
      playoffStartDate: formData.playoffStartDate?.toISOString() || null,
      playoffEndDate: formData.playoffEndDate?.toISOString() || null,
    };
    createModelMutation.mutate(modelData);
  };

  const handleLoadModel = (modelId: string) => {
    const modelToLoad = models?.find((model: BudgetModel) => model.id === modelId);
    if (modelToLoad) {
      setFormData({
        discipline: modelToLoad.discipline,
        level: modelToLoad.level,
        category: modelToLoad.category,
        gender: modelToLoad.gender,
        seasonYear: modelToLoad.seasonYear,
        headCoachRate: Number(modelToLoad.headCoachRate),
        assistantCoachRate: Number(modelToLoad.assistantCoachRate),
        employerContributionRate: Number(modelToLoad.employerContributionRate),
        seasonStartDate: modelToLoad.seasonStartDate ? new Date(modelToLoad.seasonStartDate) : undefined,
        seasonEndDate: modelToLoad.seasonEndDate ? new Date(modelToLoad.seasonEndDate) : undefined,
        practicesPerWeek: modelToLoad.practicesPerWeek,
        practiceDuration: Number(modelToLoad.practiceDuration),
        numGames: modelToLoad.numGames,
        gameDuration: Number(modelToLoad.gameDuration),
        playoffStartDate: modelToLoad.playoffStartDate ? new Date(modelToLoad.playoffStartDate) : undefined,
        playoffEndDate: modelToLoad.playoffEndDate ? new Date(modelToLoad.playoffEndDate) : undefined,
        playoffFinalDays: modelToLoad.playoffFinalDays,
        playoffFinalsDuration: Number(modelToLoad.playoffFinalsDuration),
        tournamentBonus: Number(modelToLoad.tournamentBonus),
        federationFee: Number(modelToLoad.federationFee),
        transportationFee: Number(modelToLoad.transportationFee),
      });
      setLoadedModelId(modelToLoad.id);
      toast.info(`Modèle "${modelToLoad.name}" chargé.`);
    }
  };

  const handleNewBudget = () => {
    resetForm();
    setLoadedModelId(null);
    toast.info('Nouveau formulaire de budget initialisé.');
  };

  // Chart data configuration
  const chartData = {
    labels: [
      'Entraînements (Saison)',
      'Matchs (Saison)',
      'Entraînements (Séries)',
      'Finales (Séries)',
      'Bonus Tournoi',
      'Frais Fédération',
      'Frais Transport'
    ],
    datasets: [{
      data: [
        results.costSeasonPractices,
        results.costSeasonGames,
        results.costPlayoffPractices,
        results.costPlayoffFinals,
        results.tournamentBonus,
        results.federationFee,
        formData.transportationFee
      ],
      backgroundColor: [
        'hsl(213, 100%, 35%)',
        'hsl(195, 80%, 45%)',
        'hsl(175, 70%, 50%)',
        'hsl(160, 60%, 55%)',
        'hsl(145, 50%, 60%)',
        'hsl(130, 40%, 65%)',
        'hsl(115, 30%, 70%)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            family: 'Inter',
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const formatted = formatCurrency(value);
            return `${context.label}: ${formatted}`;
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-foreground/10 p-3 rounded-lg">
                <Calculator className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Calculateur de Budget d'Équipe Sportive</h1>
                <p className="text-primary-foreground/80 mt-1">Planification budgétaire pour équipes sportives</p>
              </div>
            </div>
            <Button asChild variant="secondary" size="lg">
              <Link href="/report">
                <FileText className="mr-2 h-5 w-5" />
                Générer Rapport
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl font-semibold text-primary flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Paramètres de Configuration</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Basic Team Information */}
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Informations de l'Équipe</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="seasonYear">Année de saison</Label>
                      <Input
                        id="seasonYear"
                        type="text"
                        value={formData.seasonYear}
                        onChange={(e) => handleInputChange('seasonYear', e.target.value)}
                        data-testid="input-season-year"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Genre</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(value) => handleInputChange('gender', value)}
                      >
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Féminin">Féminin</SelectItem>
                          <SelectItem value="Masculin">Masculin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discipline">Discipline</Label>
                      <Select 
                        value={formData.discipline} 
                        onValueChange={(value) => handleInputChange('discipline', value)}
                      >
                        <SelectTrigger data-testid="select-discipline">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Handball">Handball</SelectItem>
                          <SelectItem value="Basketball">Basketball</SelectItem>
                          <SelectItem value="Volleyball">Volleyball</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">Niveau</Label>
                      <Select 
                        value={formData.level} 
                        onValueChange={(value) => handleInputChange('level', value)}
                      >
                        <SelectTrigger data-testid="select-level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Benjamin">Benjamin</SelectItem>
                          <SelectItem value="Cadet">Cadet</SelectItem>
                          <SelectItem value="Juvenile">Juvénile</SelectItem>
                          <SelectItem value="Tous">Tous</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="D2">D2</SelectItem>
                          <SelectItem value="D3">D3</SelectItem>
                          <SelectItem value="D4">D4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </fieldset>

                {/* Coaches */}
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Entraîneurs</legend>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="headCoachRate">Taux horaire Chef ($/h)</Label>
                      <Input
                        id="headCoachRate"
                        type="number"
                        value={formData.headCoachRate}
                        onChange={(e) => handleInputChange('headCoachRate', e.target.value)}
                        data-testid="input-head-coach-rate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assistantCoachRate">Taux horaire Adjoint ($/h)</Label>
                      <Input
                        id="assistantCoachRate"
                        type="number"
                        value={formData.assistantCoachRate}
                        onChange={(e) => handleInputChange('assistantCoachRate', e.target.value)}
                        data-testid="input-assistant-coach-rate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employerContributionRate">Charges patronales (%)</Label>
                      <Input
                        id="employerContributionRate"
                        type="number"
                        step="0.1"
                        value={formData.employerContributionRate}
                        onChange={(e) => handleInputChange('employerContributionRate', e.target.value)}
                        data-testid="input-employer-contribution"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Season Dates */}
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dates de Saison
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="seasonStartDate">Début saison régulière</Label>
                      <Input
                        id="seasonStartDate"
                        type="date"
                        value={formData.seasonStartDate?.toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('seasonStartDate', new Date(e.target.value))}
                        data-testid="input-season-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seasonEndDate">Fin saison régulière</Label>
                      <Input
                        id="seasonEndDate"
                        type="date"
                        value={formData.seasonEndDate?.toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('seasonEndDate', new Date(e.target.value))}
                        data-testid="input-season-end"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playoffStartDate">Début playoffs</Label>
                      <Input
                        id="playoffStartDate"
                        type="date"
                        value={formData.playoffStartDate?.toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('playoffStartDate', new Date(e.target.value))}
                        data-testid="input-playoff-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playoffEndDate">Fin playoffs</Label>
                      <Input
                        id="playoffEndDate"
                        type="date"
                        value={formData.playoffEndDate?.toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('playoffEndDate', new Date(e.target.value))}
                        data-testid="input-playoff-end"
                      />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Saison régulière:</strong> {results.activeSeasonWeeks} semaines actives
                      </div>
                      <div>
                        <strong>Playoffs:</strong> {results.activePlayoffWeeks} semaines actives
                      </div>
                    </div>
                  </div>
                </fieldset>

                {/* Season Parameters */}
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Paramètres de Saison</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="practicesPerWeek">Entraînements / semaine</Label>
                      <Input
                        id="practicesPerWeek"
                        type="number"
                        value={formData.practicesPerWeek}
                        onChange={(e) => handleInputChange('practicesPerWeek', e.target.value)}
                        data-testid="input-practices-per-week"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practiceDuration">Durée entraînement (heures)</Label>
                      <Input
                        id="practiceDuration"
                        type="number"
                        step="0.5"
                        value={formData.practiceDuration}
                        onChange={(e) => handleInputChange('practiceDuration', e.target.value)}
                        data-testid="input-practice-duration"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numGames">Nombre de matchs</Label>
                      <Input
                        id="numGames"
                        type="number"
                        value={formData.numGames}
                        onChange={(e) => handleInputChange('numGames', e.target.value)}
                        data-testid="input-num-games"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gameDuration">Durée match (heures)</Label>
                      <Input
                        id="gameDuration"
                        type="number"
                        step="0.5"
                        value={formData.gameDuration}
                        onChange={(e) => handleInputChange('gameDuration', e.target.value)}
                        data-testid="input-game-duration"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Playoffs */}
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Séries (Playoffs)</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="playoffFinalDays">Jours de finales</Label>
                      <Input
                        id="playoffFinalDays"
                        type="number"
                        value={formData.playoffFinalDays}
                        onChange={(e) => handleInputChange('playoffFinalDays', e.target.value)}
                        data-testid="input-playoff-final-days"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playoffFinalsDuration">Durée jour de finale (heures)</Label>
                      <Input
                        id="playoffFinalsDuration"
                        type="number"
                        value={formData.playoffFinalsDuration}
                        onChange={(e) => handleInputChange('playoffFinalsDuration', e.target.value)}
                        data-testid="input-playoff-finals-duration"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Other Costs */}
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Autres Coûts</legend>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="tournamentBonus">Bonus Tournoi ($)</Label>
                      <Input
                        id="tournamentBonus"
                        type="number"
                        value={formData.tournamentBonus}
                        onChange={(e) => handleInputChange('tournamentBonus', e.target.value)}
                        data-testid="input-tournament-bonus"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="federationFee">Frais Fédération (RSEQ) ($)</Label>
                      <Input
                        id="federationFee"
                        type="number"
                        value={formData.federationFee}
                        onChange={(e) => handleInputChange('federationFee', e.target.value)}
                        data-testid="input-federation-fee"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transportationFee">Frais de Transport ($)</Label>
                      <Input
                        id="transportationFee"
                        type="number"
                        value={formData.transportationFee}
                        onChange={(e) => handleInputChange('transportationFee', e.target.value)}
                        data-testid="input-transportation-fee"
                      />
                    </div>
                  </div>
                </fieldset>
              </CardContent>
            </Card>
          </div>

          {/* Results and Model Management */}
          <div className="space-y-6">
            {/* Budget Breakdown Table */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl font-semibold text-primary flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Répartition des Coûts</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Poste de Dépense</th>
                        <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Coût</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-2">Entraînements (Saison régulière)</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold" data-testid="text-season-practices">
                          {formatCurrency(results.costSeasonPractices)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-2">Matchs (Saison régulière)</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold" data-testid="text-season-games">
                          {formatCurrency(results.costSeasonGames)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-2">Bonus Tournoi</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold" data-testid="text-tournament">
                          {formatCurrency(results.tournamentBonus)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-2">Frais de Transport</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold" data-testid="text-transportation">
                          {formatCurrency(formData.transportationFee)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-2">Frais de Fédération (RSEQ)</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold" data-testid="text-federation">
                          {formatCurrency(results.federationFee)}
                        </td>
                      </tr>
                      <tr className="bg-muted/70 font-medium">
                        <td className="py-2 px-2"><strong>Sous-total Saison Régulière</strong></td>
                        <td className="py-2 px-2 text-right font-mono font-bold" data-testid="text-subtotal-regular">
                          {formatCurrency(results.subTotalRegularSeason)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-2">Entraînements (Séries)</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold" data-testid="text-playoff-practices">
                          {formatCurrency(results.costPlayoffPractices)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-2">Journées de finales (Séries)</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold" data-testid="text-playoff-finals">
                          {formatCurrency(results.costPlayoffFinals)}
                        </td>
                      </tr>
                      <tr className="bg-muted/70 font-medium">
                        <td className="py-2 px-2"><strong>Sous-total Playoffs</strong></td>
                        <td className="py-2 px-2 text-right font-mono font-bold" data-testid="text-subtotal-playoffs">
                          {formatCurrency(results.subTotalPlayoffs)}
                        </td>
                      </tr>
                      <tr className="bg-primary text-primary-foreground font-bold text-base">
                        <td className="py-3 px-2">BUDGET TOTAL</td>
                        <td className="py-3 px-2 text-right font-mono" data-testid="text-grand-total">
                          {formatCurrency(results.grandTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Chart Visualization */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl font-semibold text-primary flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Visualisation du Budget</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="bg-muted/30 rounded-lg p-4 h-80">
                  <Doughnut data={chartData} options={chartOptions} data-testid="chart-budget" />
                </div>
              </CardContent>
            </Card>

            {/* Model Management */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl font-semibold text-primary">Gestion des Modèles</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Nom du nouveau modèle</Label>
                  <Input
                    id="model-name"
                    placeholder="Ex: U16 F D1 2025-2026"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    disabled={createModelMutation.isPending}
                    data-testid="input-model-name"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveModel}
                    disabled={createModelMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-model"
                  >
                    {createModelMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder le modèle'}
                  </Button>
                  {loadedModelId && (
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" data-testid="button-delete-model">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le modèle ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible et supprimera définitivement ce modèle de
                            budget.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              if (loadedModelId) {
                                deleteModelMutation.mutate(loadedModelId);
                              }
                            }}
                            disabled={deleteModelMutation.isPending}
                          >
                            {deleteModelMutation.isPending ? 'Suppression...' : 'Confirmer'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <Label>Charger un modèle existant</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={handleLoadModel}
                      disabled={isLoadingModels || isErrorModels || !models?.length}
                    >
                      <SelectTrigger data-testid="select-load-model">
                        <SelectValue placeholder="Sélectionner un modèle..." />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingModels && <SelectItem value="loading">Chargement...</SelectItem>}
                        {isErrorModels && (
                          <SelectItem value="error">Erreur de chargement</SelectItem>
                        )}
                        {models?.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={handleNewBudget} data-testid="button-new-budget">
                      <PlusCircle className="h-4 w-4" />
                      <span className="sr-only">Nouveau Budget</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
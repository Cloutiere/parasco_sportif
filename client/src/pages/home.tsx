// [client/src/pages/home.tsx] - Version 30.0 - Implémentation de la logique de mise à jour (Upsert)
import { useState, useEffect, useMemo } from 'react'; // Ajout de useMemo
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Settings, BarChart3, Calculator, CalendarIcon, Archive, FileText, Trash2, FileDown } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { format, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useBudgetCalculator } from '../hooks/useBudgetCalculator';
import { HOLIDAY_WEEKS_STARTS } from '../lib/date-utils';
import { createBudgetModel, getBudgetModels, updateBudgetModel } from '../lib/api-client'; // Ajout de updateBudgetModel
import { exportToExcel } from '../lib/excel-export';
import type { InsertBudgetModel, BudgetModel } from '@shared/schema';
import { useToast } from '../hooks/use-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

export default function Home() {
  const { formData, results, handleInputChange, formatCurrency, setFormData } = useBudgetCalculator();
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [generatedModelName, setGeneratedModelName] = useState('');
  const [numberOfTeams, setNumberOfTeams] = useState(1);
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const budgetModelsQuery = useQuery({
    queryKey: ['budgetModels'],
    queryFn: getBudgetModels,
  });

  // Détection du mode édition : le modèle existe-t-il déjà ?
  const existingModel = useMemo(() => {
    if (!budgetModelsQuery.data || !generatedModelName) {
      return undefined;
    }
    // Ne pas considérer le modèle actuellement chargé comme "existant" à écraser par un autre.
    // L'upsert se base sur le nom, pas sur l'ID chargé.
    return budgetModelsQuery.data.find(model => model.name === generatedModelName);
  }, [budgetModelsQuery.data, generatedModelName]);

  // Effet pour générer le nom du modèle automatiquement
  useEffect(() => {
    const { seasonYear, schoolName, discipline, gender, category, level } = formData;
    const name = [seasonYear, schoolName, discipline, gender, category, level].join(' ').trim();
    setGeneratedModelName(name);
  }, [
    formData.seasonYear,
    formData.schoolName,
    formData.discipline,
    formData.gender,
    formData.category,
    formData.level,
  ]);

  const createModelMutation = useMutation({
    mutationFn: (payload: InsertBudgetModel) => createBudgetModel(payload),
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Modèle sauvegardé avec succès !',
      });
      queryClient.invalidateQueries({ queryKey: ['budgetModels'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde du modèle.',
      });
    },
  });

  // NOUVELLE MUTATION pour la mise à jour
  const updateModelMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<InsertBudgetModel> }) =>
      updateBudgetModel(id, payload),
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Modèle mis à jour avec succès !',
      });
      queryClient.invalidateQueries({ queryKey: ['budgetModels'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du modèle.',
      });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await fetch(`/api/budget-models/${modelId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete model');
      }
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Modèle supprimé avec succès',
      });
      setLoadedModelId(null);
      queryClient.invalidateQueries({ queryKey: ['budgetModels'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la suppression du modèle.',
      });
    },
  });

  const handleDeleteLoadedModel = () => {
    if (!loadedModelId) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.')) {
      deleteModelMutation.mutate(loadedModelId);
    }
  };

  // MISE À JOUR de la logique de sauvegarde
  const handleSaveModel = () => {
    const payload: InsertBudgetModel = {
      ...formData,
      name: generatedModelName,
      numberOfTeams,
      seasonStartDate: formData.seasonStartDate ? formData.seasonStartDate.toISOString() : null,
      seasonEndDate: formData.seasonEndDate ? formData.seasonEndDate.toISOString() : null,
      playoffStartDate: formData.playoffStartDate ? formData.playoffStartDate.toISOString() : null,
      playoffEndDate: formData.playoffEndDate ? formData.playoffEndDate.toISOString() : null,
    };

    if (existingModel) {
      // Si le modèle existe, on le met à jour
      updateModelMutation.mutate({ id: existingModel.id, payload });
    } else {
      // Sinon, on le crée
      createModelMutation.mutate(payload);
    }
  };

  const handleExportClick = () => {
    exportToExcel(formData, results, generatedModelName);
  };

  const handleLoadModel = (modelId: string) => {
    if (modelId === 'loading' || modelId === 'error' || modelId === 'none') return;

    const model = budgetModelsQuery.data?.find(m => m.id === modelId);
    if (!model) return;

    setNumberOfTeams(model.numberOfTeams);
    setLoadedModelId(modelId);

    // Convertir les chaînes de l'API en types attendus par le formulaire
    setFormData({
      ...model,
      // Les champs numériques 'decimal' arrivent comme des strings, il faut les convertir
      headCoachRate: Number(model.headCoachRate),
      assistantCoachRate: Number(model.assistantCoachRate),
      employerContributionRate: Number(model.employerContributionRate),
      practiceDuration: Number(model.practiceDuration),
      gameDuration: Number(model.gameDuration),
      playoffFinalsDuration: Number(model.playoffFinalsDuration),
      tournamentBonus: Number(model.tournamentBonus),
      federationFee: Number(model.federationFee),
      transportationFee: Number(model.transportationFee),
      // Convertir les dates ISO string en objets Date
      seasonStartDate: model.seasonStartDate ? new Date(model.seasonStartDate) : null,
      seasonEndDate: model.seasonEndDate ? new Date(model.seasonEndDate) : null,
      playoffStartDate: model.playoffStartDate ? new Date(model.playoffStartDate) : null,
      playoffEndDate: model.playoffEndDate ? new Date(model.playoffEndDate) : null,
    });
  };

  const rangeStyle = {
    backgroundColor: 'hsl(195, 100%, 95%)',
    color: 'hsl(215, 30%, 25%)',
  };

  const holidayStyle = {
    backgroundColor: 'hsl(210, 30%, 95%)',
  };

  const seasonModifiers = {
    range:
      formData.seasonStartDate && formData.seasonEndDate
        ? { from: formData.seasonStartDate, to: formData.seasonEndDate }
        : undefined,
  };

  const playoffModifiers = {
    range:
      formData.playoffStartDate && formData.playoffEndDate
        ? { from: formData.playoffStartDate, to: formData.playoffEndDate }
        : undefined,
  };

  const holidayModifier = {
    holiday: (date: Date) => HOLIDAY_WEEKS_STARTS.has(startOfWeek(date, { weekStartsOn: 0 }).getTime()),
  };

  const chartData = {
    labels: [
      'Entraînements (Saison)',
      'Matchs (Saison)',
      'Entraînements (Séries)',
      'Finales (Séries)',
      'Frais Tournoi',
      'Frais de transport',
      'Frais Fédération',
    ],
    datasets: [
      {
        data: [
          results.costSeasonPractices,
          results.costSeasonGames,
          results.costPlayoffPractices,
          results.costPlayoffFinals,
          results.tournamentBonus,
          formData.transportationFee, // NOTE: Utilisation de formData car c'est une entrée directe
          results.federationFee,
        ],
        backgroundColor: [
          'hsl(213, 100%, 35%)',
          'hsl(195, 80%, 45%)',
          'hsl(175, 70%, 50%)',
          'hsl(160, 60%, 55%)',
          'hsl(145, 50%, 60%)',
          'hsl(130, 40%, 65%)',
          'hsl(115, 40%, 70%)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
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
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.parsed;
            const formatted = formatCurrency(value);
            return `${context.label}: ${formatted}`;
          },
        },
      },
    },
  };

  const isSaving = createModelMutation.isPending || updateModelMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header ... */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-foreground/10 p-3 rounded-lg">
              <Calculator className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Calculateur de Budget d'Équipe Sportive</h1>
              <p className="text-primary-foreground/80 mt-1">Planification budgétaire pour équipes sportives</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Budget Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl font-semibold text-primary flex items-center space-x-2">
                  <Archive className="w-5 h-5" />
                  <span>Gestion du Modèle</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="load-model">Charger un modèle existant</Label>
                  <Select onValueChange={handleLoadModel} disabled={budgetModelsQuery.isLoading} name="load-model">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un modèle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetModelsQuery.isLoading && (
                        <SelectItem key="loading" value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      )}
                      {budgetModelsQuery.isError && (
                        <SelectItem key="error" value="error" disabled>
                          Erreur de chargement
                        </SelectItem>
                      )}
                      {budgetModelsQuery.data && budgetModelsQuery.data.length === 0 && (
                        <SelectItem key="none" value="none" disabled>
                          Aucun modèle trouvé
                        </SelectItem>
                      )}
                      {budgetModelsQuery.data?.map((model: BudgetModel) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nom du Modèle (généré automatiquement)</Label>
                  <div className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {generatedModelName || "Veuillez remplir les informations de l'équipe..."}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfTeams">Nombre d’équipes</Label>
                  <Input
                    id="numberOfTeams"
                    type="number"
                    min="1"
                    value={numberOfTeams}
                    onChange={e => setNumberOfTeams(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    {/* MISE À JOUR DU BOUTON DE SAUVEGARDE */}
                    <Button onClick={handleSaveModel} disabled={isSaving || !generatedModelName} className="w-full">
                      {isSaving
                        ? existingModel
                          ? 'Mise à jour...'
                          : 'Sauvegarde...'
                        : existingModel
                          ? 'Mettre à jour le modèle'
                          : 'Sauvegarder le modèle'}
                    </Button>
                    <Button onClick={handleExportClick} variant="outline">
                      <FileDown className="mr-2 h-4 w-4" />
                      Exporter en Excel
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button asChild variant="outline">
                      <Link href="/report">
                        <FileText className="mr-2 h-4 w-4" />
                        Voir le Rapport
                      </Link>
                    </Button>
                    <Button
                      onClick={handleDeleteLoadedModel}
                      variant="destructive"
                      disabled={deleteModelMutation.isPending || !loadedModelId}
                      data-testid="button-delete-model"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteModelMutation.isPending ? 'Suppression...' : 'Supprimer ce modèle'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl font-semibold text-primary flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Paramètres de Configuration</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* ... fieldsets ... */}
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">
                    Informations de l'Équipe
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="seasonYear">Année scolaire</Label>
                      <Input
                        id="seasonYear"
                        value={formData.seasonYear}
                        onChange={e => handleInputChange('seasonYear', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolName">Nom de l'école</Label>
                      <Input
                        id="schoolName"
                        value={formData.schoolName}
                        onChange={e => handleInputChange('schoolName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schoolCode">Code d'identification</Label>
                      <Input
                        id="schoolCode"
                        value={formData.schoolCode}
                        onChange={e => handleInputChange('schoolCode', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discipline">Discipline</Label>
                      <Select value={formData.discipline} onValueChange={value => handleInputChange('discipline', value)}>
                        <SelectTrigger data-testid="select-discipline">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="Handball" value="Handball">
                            Handball
                          </SelectItem>
                          <SelectItem key="Basketball" value="Basketball">
                            Basketball
                          </SelectItem>
                          <SelectItem key="Volleyball" value="Volleyball">
                            Volleyball
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Sexe</Label>
                      <Select value={formData.gender} onValueChange={value => handleInputChange('gender', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="Féminin" value="Féminin">
                            Féminin
                          </SelectItem>
                          <SelectItem key="Masculin" value="Masculin">
                            Masculin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select value={formData.category} onValueChange={value => handleInputChange('category', value)}>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="D2" value="D2">
                            D2
                          </SelectItem>
                          <SelectItem key="D3" value="D3">
                            D3
                          </SelectItem>
                          <SelectItem key="D4" value="D4">
                            D4
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">Niveau</Label>
                      <Select value={formData.level} onValueChange={value => handleInputChange('level', value)}>
                        <SelectTrigger data-testid="select-level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="Benjamin" value="Benjamin">
                            Benjamin
                          </SelectItem>
                          <SelectItem key="Cadet" value="Cadet">
                            Cadet
                          </SelectItem>
                          <SelectItem key="Juvenile" value="Juvenile">
                            Juvénile
                          </SelectItem>
                          <SelectItem key="Tous" value="Tous">
                            Tous
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </fieldset>
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Entraîneurs</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="headCoachRate">Taux horaire Chef ($/h)</Label>
                      <Input
                        id="headCoachRate"
                        type="number"
                        value={formData.headCoachRate}
                        onChange={e => handleInputChange('headCoachRate', e.target.value)}
                        data-testid="input-head-coach-rate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assistantCoachRate">Taux horaire Adjoint ($/h)</Label>
                      <Input
                        id="assistantCoachRate"
                        type="number"
                        value={formData.assistantCoachRate}
                        onChange={e => handleInputChange('assistantCoachRate', e.target.value)}
                        data-testid="input-assistant-coach-rate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employerContributionRate">Part employeur (%)</Label>
                      <Input
                        id="employerContributionRate"
                        type="number"
                        step="0.1"
                        value={formData.employerContributionRate}
                        onChange={e => handleInputChange('employerContributionRate', e.target.value)}
                        data-testid="input-employer-contribution-rate"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Regular Season */}
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Saison Régulière</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Début de la saison</Label>
                      <Popover
                        open={openPopover === 'seasonStartDate'}
                        onOpenChange={isOpen => setOpenPopover(isOpen ? 'seasonStartDate' : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className="w-full justify-start text-left font-normal"
                            data-testid="date-start-season-trigger"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.seasonStartDate ? (
                              format(formData.seasonStartDate, 'd MMM yyyy', { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            month={formData.seasonStartDate ? subMonths(formData.seasonStartDate, 1) : undefined}
                            selected={formData.seasonStartDate}
                            onSelect={date => {
                              handleInputChange(
                                'seasonStartDate',
                                date ? startOfWeek(date, { weekStartsOn: 0 }) : undefined
                              );
                              setOpenPopover(null);
                            }}
                            disabled={date => (formData.seasonEndDate ? date > formData.seasonEndDate : false)}
                            initialFocus
                            numberOfMonths={3}
                            modifiers={{ ...seasonModifiers, ...holidayModifier }}
                            modifiersStyles={{ range: rangeStyle, holiday: holidayStyle }}
                            showOutsideDays={false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Fin de la saison</Label>
                      <Popover
                        open={openPopover === 'seasonEndDate'}
                        onOpenChange={isOpen => setOpenPopover(isOpen ? 'seasonEndDate' : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className="w-full justify-start text-left font-normal"
                            data-testid="date-end-season-trigger"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.seasonEndDate ? (
                              format(formData.seasonEndDate, 'd MMM yyyy', { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            month={formData.seasonEndDate ? subMonths(formData.seasonEndDate, 1) : undefined}
                            selected={formData.seasonEndDate}
                            onSelect={date => {
                              handleInputChange('seasonEndDate', date ? endOfWeek(date, { weekStartsOn: 0 }) : undefined);
                              setOpenPopover(null);
                            }}
                            disabled={date => (formData.seasonStartDate ? date < formData.seasonStartDate : false)}
                            initialFocus
                            numberOfMonths={3}
                            modifiers={{ ...seasonModifiers, ...holidayModifier }}
                            modifiersStyles={{ range: rangeStyle, holiday: holidayStyle }}
                            showOutsideDays={false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* ... */}
                    <div className="md:col-span-2 text-center bg-muted/50 p-2 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Durée calculée :{' '}
                        <strong className="text-primary" data-testid="text-active-season-weeks">
                          {results.activeSeasonWeeks} semaines actives
                        </strong>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practicesPerWeek">Entraînements / semaine</Label>
                      <Input
                        id="practicesPerWeek"
                        type="number"
                        value={formData.practicesPerWeek}
                        onChange={e => handleInputChange('practicesPerWeek', e.target.value)}
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
                        onChange={e => handleInputChange('practiceDuration', e.target.value)}
                        data-testid="input-practice-duration"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numGames">Nombre de matchs</Label>
                      <Input
                        id="numGames"
                        type="number"
                        value={formData.numGames}
                        onChange={e => handleInputChange('numGames', e.target.value)}
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
                        onChange={e => handleInputChange('gameDuration', e.target.value)}
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
                      <Label>Début des séries</Label>
                      <Popover
                        open={openPopover === 'playoffStartDate'}
                        onOpenChange={isOpen => setOpenPopover(isOpen ? 'playoffStartDate' : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className="w-full justify-start text-left font-normal"
                            data-testid="date-start-playoffs-trigger"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.playoffStartDate ? (
                              format(formData.playoffStartDate, 'd MMM yyyy', { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            month={formData.playoffStartDate ? subMonths(formData.playoffStartDate, 1) : undefined}
                            selected={formData.playoffStartDate}
                            onSelect={date => {
                              handleInputChange(
                                'playoffStartDate',
                                date ? startOfWeek(date, { weekStartsOn: 0 }) : undefined
                              );
                              setOpenPopover(null);
                            }}
                            disabled={date => (formData.playoffEndDate ? date > formData.playoffEndDate : false)}
                            initialFocus
                            numberOfMonths={3}
                            modifiers={{ ...playoffModifiers, ...holidayModifier }}
                            modifiersStyles={{ range: rangeStyle, holiday: holidayStyle }}
                            showOutsideDays={false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Fin des séries</Label>
                      <Popover
                        open={openPopover === 'playoffEndDate'}
                        onOpenChange={isOpen => setOpenPopover(isOpen ? 'playoffEndDate' : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className="w-full justify-start text-left font-normal"
                            data-testid="date-end-playoffs-trigger"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.playoffEndDate ? (
                              format(formData.playoffEndDate, 'd MMM yyyy', { locale: fr })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            month={formData.playoffEndDate ? subMonths(formData.playoffEndDate, 1) : undefined}
                            selected={formData.playoffEndDate}
                            onSelect={date => {
                              handleInputChange(
                                'playoffEndDate',
                                date ? endOfWeek(date, { weekStartsOn: 0 }) : undefined
                              );
                              setOpenPopover(null);
                            }}
                            disabled={date => (formData.playoffStartDate ? date < formData.playoffStartDate : false)}
                            initialFocus
                            numberOfMonths={3}
                            modifiers={{ ...playoffModifiers, ...holidayModifier }}
                            modifiersStyles={{ range: rangeStyle, holiday: holidayStyle }}
                            showOutsideDays={false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* ... */}
                    <div className="md:col-span-2 text-center bg-muted/50 p-2 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Durée calculée :{' '}
                        <strong className="text-primary" data-testid="text-active-playoff-weeks">
                          {results.activePlayoffWeeks} semaines actives
                        </strong>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playoffFinalDays">Jours de finales</Label>
                      <Input
                        id="playoffFinalDays"
                        type="number"
                        value={formData.playoffFinalDays}
                        onChange={e => handleInputChange('playoffFinalDays', e.target.value)}
                        data-testid="input-playoff-final-days"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playoffFinalsDuration">Durée jour de finale (heures)</Label>
                      <Input
                        id="playoffFinalsDuration"
                        type="number"
                        value={formData.playoffFinalsDuration}
                        onChange={e => handleInputChange('playoffFinalsDuration', e.target.value)}
                        data-testid="input-playoff-finals-duration"
                      />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Autres Coûts</legend>
                  <div className="grid grid-cols-1 md:col-span-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="tournamentBonus">Frais Tournoi ($)</Label>
                      <Input
                        id="tournamentBonus"
                        type="number"
                        value={formData.tournamentBonus}
                        onChange={e => handleInputChange('tournamentBonus', e.target.value)}
                        data-testid="input-tournament-bonus"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="federationFee">Frais Fédération (RSEQ) ($)</Label>
                      <Input
                        id="federationFee"
                        type="number"
                        value={formData.federationFee}
                        onChange={e => handleInputChange('federationFee', e.target.value)}
                        data-testid="input-federation-fee"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transportationFee">Frais de transport ($)</Label>
                      <Input
                        id="transportationFee"
                        type="number"
                        value={formData.transportationFee}
                        onChange={e => handleInputChange('transportationFee', e.target.value)}
                        data-testid="input-transportation-fee"
                      />
                    </div>
                  </div>
                </fieldset>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl font-semibold text-primary flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Répartition des Coûts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Poste de Dépense</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Coût Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* --- SAISON RÉGULIÈRE --- */}
                      <tr className="bg-muted/30">
                        <th colSpan={2} className="text-left py-2 px-4 font-bold text-primary">
                          Saison Régulière
                        </th>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">Entraînements (Saison régulière)</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold" data-testid="text-season-practices">
                          {formatCurrency(results.costSeasonPractices)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">Matchs (Saison régulière)</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold" data-testid="text-season-games">
                          {formatCurrency(results.costSeasonGames)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">Frais Tournoi</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold" data-testid="text-tournament">
                          {formatCurrency(results.tournamentBonus)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">Frais de transport</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold" data-testid="text-transportation">
                          {formatCurrency(formData.transportationFee)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">Frais de Fédération (RSEQ)</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold" data-testid="text-federation">
                          {formatCurrency(results.federationFee)}
                        </td>
                      </tr>
                      <tr className="bg-muted/70 font-medium">
                        <td className="py-3 px-4">
                          <strong>Sous-total Saison Régulière</strong>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold" data-testid="text-subtotal-season">
                          {formatCurrency(results.subTotalRegularSeason)}
                        </td>
                      </tr>

                      {/* --- SÉRIES --- */}
                      <tr className="bg-muted/30">
                        <th colSpan={2} className="text-left py-2 px-4 font-bold text-primary">
                          Séries (Playoffs)
                        </th>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">Entraînements (Séries)</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold" data-testid="text-playoff-practices">
                          {formatCurrency(results.costPlayoffPractices)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">Journées de finales (Séries)</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold" data-testid="text-playoff-finals">
                          {formatCurrency(results.costPlayoffFinals)}
                        </td>
                      </tr>
                      <tr className="bg-muted/70 font-medium">
                        <td className="py-3 px-4">
                          <strong>Sous-total Séries</strong>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold" data-testid="text-subtotal-playoffs">
                          {formatCurrency(results.subTotalPlayoffs)}
                        </td>
                      </tr>

                      {/* --- TOTAL --- */}
                      <tr className="bg-primary text-primary-foreground font-bold text-lg">
                        <td className="py-4 px-4">BUDGET TOTAL</td>
                        <td className="py-4 px-4 text-right font-mono" data-testid="text-grand-total">
                          {formatCurrency(results.grandTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

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
          </div>
        </div>
      </main>
    </div>
  );
}
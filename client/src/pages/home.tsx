// [client/src/pages/home.tsx] - Version 7.0 - Ouverture contextuelle du calendrier au bon mois

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Settings, BarChart3, Calculator, CalendarIcon } from 'lucide-react';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
// NOUVEAU : Importation de useState
import { useState } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

export default function Home() {
  const { formData, results, handleInputChange, handleDateRangeChange, formatCurrency } = useBudgetCalculator();

  // NOUVEAU : État local pour contrôler le mois d'ouverture du calendrier.
  const [calendarDefaultView, setCalendarDefaultView] = useState<Date | undefined>();

  // ... (Chart data and options remain the same)
  const chartData = {
    labels: [
      'Entraînements (Saison)',
      'Matchs (Saison)',
      'Entraînements (Séries)',
      'Finales (Séries)',
      'Bonus Tournoi',
      'Frais Fédération'
    ],
    datasets: [{
      data: [
        results.costSeasonPractices,
        results.costSeasonGames,
        results.costPlayoffPractices,
        results.costPlayoffFinals,
        results.tournamentBonus,
        results.federationFee
      ],
      backgroundColor: [
        'hsl(213, 100%, 35%)',
        'hsl(195, 80%, 45%)',
        'hsl(175, 70%, 50%)',
        'hsl(160, 60%, 55%)',
        'hsl(145, 50%, 60%)',
        'hsl(130, 40%, 65%)'
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
                  <Settings className="w-5 h-5" />
                  <span>Paramètres de Configuration</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Informations de l'Équipe</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Entraîneurs</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                  </div>
                </fieldset>

                {/* Regular Season */}
                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Saison Régulière</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2 md:col-span-2">
                      <div className="grid grid-cols-2 gap-4">
                        <Label>Début de la saison</Label>
                        <Label>Fin de la saison</Label>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="flex items-center w-full border border-input rounded-md text-sm font-normal cursor-pointer hover:bg-accent/50 transition-colors" data-testid="date-range-season-trigger">
                            {/* MODIFIÉ : Ajout de onPointerDown pour la date de début */}
                            <div 
                              className="flex items-center p-2 w-1/2"
                              onPointerDown={() => setCalendarDefaultView(formData.seasonStartDate)}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.seasonStartDate ? format(formData.seasonStartDate, "d MMM yyyy", { locale: fr }) : <span>Choisir</span>}
                            </div>
                            {/* MODIFIÉ : Ajout de onPointerDown pour la date de fin */}
                            <div 
                              className="flex items-center p-2 w-1/2 border-l border-input"
                              onPointerDown={() => setCalendarDefaultView(formData.seasonEndDate || formData.seasonStartDate)}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.seasonEndDate ? format(formData.seasonEndDate, "d MMM yyyy", { locale: fr }) : <span>Choisir</span>}
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            // MODIFIÉ : Utilisation de l'état local pour le mois par défaut
                            defaultMonth={calendarDefaultView}
                            selected={{ from: formData.seasonStartDate, to: formData.seasonEndDate }}
                            onSelect={(range) => handleDateRangeChange(range, 'seasonStartDate', 'seasonEndDate')}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="md:col-span-2 text-center bg-muted/50 p-2 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Durée calculée : <strong className="text-primary" data-testid="text-active-season-weeks">{results.activeSeasonWeeks} semaines actives</strong>
                      </p>
                    </div>
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
                    <div className="space-y-2 md:col-span-2">
                       <div className="grid grid-cols-2 gap-4">
                        <Label>Début des séries</Label>
                        <Label>Fin des séries</Label>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                           <div className="flex items-center w-full border border-input rounded-md text-sm font-normal cursor-pointer hover:bg-accent/50 transition-colors" data-testid="date-range-playoffs-trigger">
                            {/* MODIFIÉ : Ajout de onPointerDown pour la date de début */}
                            <div 
                              className="flex items-center p-2 w-1/2"
                              onPointerDown={() => setCalendarDefaultView(formData.playoffStartDate)}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.playoffStartDate ? format(formData.playoffStartDate, "d MMM yyyy", { locale: fr }) : <span>Choisir</span>}
                            </div>
                            {/* MODIFIÉ : Ajout de onPointerDown pour la date de fin */}
                            <div 
                              className="flex items-center p-2 w-1/2 border-l border-input"
                              onPointerDown={() => setCalendarDefaultView(formData.playoffEndDate || formData.playoffStartDate)}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.playoffEndDate ? format(formData.playoffEndDate, "d MMM yyyy", { locale: fr }) : <span>Choisir</span>}
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            // MODIFIÉ : Utilisation de l'état local pour le mois par défaut
                            defaultMonth={calendarDefaultView}
                            selected={{ from: formData.playoffStartDate, to: formData.playoffEndDate }}
                            onSelect={(range) => handleDateRangeChange(range, 'playoffStartDate', 'playoffEndDate')}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="md:col-span-2 text-center bg-muted/50 p-2 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Durée calculée : <strong className="text-primary" data-testid="text-active-playoff-weeks">{results.activePlayoffWeeks} semaines actives</strong>
                      </p>
                    </div>
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

                <fieldset className="border border-border rounded-lg p-4 bg-muted/30">
                  <legend className="text-sm font-medium text-primary px-3 bg-background">Autres Coûts</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                        <td className="py-3 px-4"><strong>Sous-total Salaires Entraîneurs</strong></td>
                        <td className="py-3 px-4 text-right font-mono font-bold" data-testid="text-total-coaching">
                          {formatCurrency(results.totalCoachingSalaries)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">Bonus Tournoi</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold" data-testid="text-tournament">
                          {formatCurrency(results.tournamentBonus)}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">Frais de Fédération (RSEQ)</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold" data-testid="text-federation">
                          {formatCurrency(results.federationFee)}
                        </td>
                      </tr>
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
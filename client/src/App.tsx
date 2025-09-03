// [client/src/App.tsx] - Version 3.0 - Mise à jour de l'import de HomePage et Toaster
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner"; // Import du Toaster de 'sonner'
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import ReportPage from "@/pages/report";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/report" component={ReportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Le Toaster de 'sonner' est plus simple et n'a pas besoin d'être à l'intérieur d'un autre composant */}
        <Toaster richColors />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
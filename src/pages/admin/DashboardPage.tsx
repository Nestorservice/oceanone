import React, { useEffect, useState } from 'react';
import { Users, Building, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const kpiIcons = {
  'Utilisateurs Actifs': Users,
  'Établissements': Building,
  'Réponses Collectées': FileText,
  'Questions Validées': CheckCircle,
};

const KPICard: React.FC<{ title: string; value: string | number; icon: React.ElementType; loading: boolean }> = ({ title, value, icon: Icon, loading }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-brand-DEFAULT">
        <Icon className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
        ) : (
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        )}
      </div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const [kpiData, setKpiData] = useState({
    users: 0,
    establishments: 0,
    answers: 0,
    validatedQuestions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKpiData = async () => {
      setLoading(true);
      try {
        const [
          { count: usersCount },
          { count: establishmentsCount },
          { count: answersCount },
          { count: validatedQuestionsCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('establishments').select('*', { count: 'exact', head: true }),
          supabase.from('answers').select('*', { count: 'exact', head: true }),
          supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'Validé'),
        ]);

        setKpiData({
          users: usersCount ?? 0,
          establishments: establishmentsCount ?? 0,
          answers: answersCount ?? 0,
          validatedQuestions: validatedQuestionsCount ?? 0,
        });
      } catch (error) {
        console.error("Error fetching KPI data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, []);

  const kpis = [
    { title: 'Utilisateurs Actifs', value: kpiData.users },
    { title: 'Établissements', value: kpiData.establishments },
    { title: 'Réponses Collectées', value: kpiData.answers },
    { title: 'Questions Validées', value: kpiData.validatedQuestions },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpiIcons[kpi.title as keyof typeof kpiIcons]}
            loading={loading}
          />
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Activité Récente</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-gray-600 dark:text-gray-400">Le journal d'activité sera affiché ici.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

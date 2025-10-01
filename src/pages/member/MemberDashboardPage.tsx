import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, FileCheck, PlusCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-brand-DEFAULT">
        <Icon className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

const MemberDashboardPage: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
        Bienvenue, {profile?.first_name || 'Membre'} !
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Prêt à commencer votre journée ?</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button className="w-full text-left p-6 bg-brand-DEFAULT hover:bg-brand-dark text-white rounded-lg shadow-lg transition-transform transform hover:scale-105">
          <PlusCircle className="h-8 w-8 mb-2" />
          <h2 className="text-xl font-bold">Nouveau Formulaire</h2>
          <p className="opacity-90">Démarrer une nouvelle collecte de données.</p>
        </button>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Visites Prévues</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune visite prévue pour aujourd'hui.</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Tâches Assignées</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vous n'avez aucune tâche en attente.</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Vos Contributions Récentes</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-gray-600 dark:text-gray-400">Vos derniers formulaires remplis apparaîtront ici.</p>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboardPage;

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { Question } from '../../types/supabase';
import { Loader2, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';

const getStatusChip = (status: string) => {
  switch (status) {
    case 'Validé':
      return <span className="flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" /> Validé</span>;
    case 'En revue':
      return <span className="flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"><Clock className="h-3 w-3 mr-1" /> En revue</span>;
    case 'Proposition':
      return <span className="flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"><FileText className="h-3 w-3 mr-1" /> Proposition</span>;
    default:
      return <span className="flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"><XCircle className="h-3 w-3 mr-1" /> Archivé</span>;
  }
};

const ContributionsPage: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');

  const fetchContributions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    if (activeTab === 'questions') {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error("Erreur lors de la récupération de vos questions : " + error.message);
      } else {
        setQuestions(data);
      }
    }
    // Placeholder for fetching completed forms
    if (activeTab === 'forms') {
      // const { data, error } = await supabase.from('responses')...
    }

    setLoading(false);
  }, [user, activeTab]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Mes Contributions</h1>
      
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('questions')}
            className={`${
              activeTab === 'questions'
                ? 'border-brand-DEFAULT text-brand-DEFAULT'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Questions Proposées
          </button>
          <button
            onClick={() => setActiveTab('forms')}
            className={`${
              activeTab === 'forms'
                ? 'border-brand-DEFAULT text-brand-DEFAULT'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Formulaires Remplis
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-DEFAULT" /></div>
      ) : (
        <div>
          {activeTab === 'questions' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {questions.length > 0 ? questions.map(q => (
                  <li key={q.id} className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question_text}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{q.question_type} • {q.category || 'N/A'}</p>
                    </div>
                    <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                      {getStatusChip(q.status)}
                    </div>
                  </li>
                )) : (
                  <li className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    Vous n'avez proposé aucune question pour le moment.
                  </li>
                )}
              </ul>
            </div>
          )}
          {activeTab === 'forms' && (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <p className="text-gray-500 dark:text-gray-400">Vous n'avez rempli aucun formulaire pour le moment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContributionsPage;

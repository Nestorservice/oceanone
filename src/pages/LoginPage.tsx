import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Une erreur s'est produite lors de la connexion.");
    } else {
      toast.success('Connexion réussie !');
      navigate('/admin/dashboard');
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
          <div className="max-w-md w-full space-y-8">
            <div>
              <Logo />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Bon retour !
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Connectez-vous à votre compte OceanCollect
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="rounded-md shadow-sm -space-y-px flex flex-col gap-y-4">
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Adresse e-mail
                  </label>
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Adresse e-mail"
                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Mot de passe
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Mot de passe"
                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Checkbox id="remember-me" label="Se souvenir de moi" />
                <div className="text-sm">
                  <a href="#" className="font-medium text-brand-DEFAULT hover:text-brand-light">
                    Mot de passe oublié ?
                  </a>
                </div>
              </div>

              <div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2 relative">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2574&auto=format&fit=crop"
            alt="Ocean waves"
          />
          <div className="absolute inset-0 bg-gray-800 bg-opacity-50"></div>
          <div className="absolute inset-0 flex items-end p-12">
              <div className="text-white">
                  <h3 className="text-4xl font-bold">Centraliser. Analyser. Décider.</h3>
                  <p className="mt-2 text-lg opacity-90">Votre solution complète pour la collecte et l'analyse de données sur le terrain.</p>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/atoms/Button';
import { Typography } from '../../../components/atoms/Typography';
import { supabase } from '../../../lib/supabase';
import { Calendar, RefreshCcw, ExternalLink } from 'lucide-react';

interface GoogleCalendarViewProps {
  clientId: string;
  userId: string;
}

export const GoogleCalendarView: React.FC<GoogleCalendarViewProps> = ({ clientId, userId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    checkConnection();
  }, [userId]);

  const checkConnection = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('consulting_oauth_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (data) setIsConnected(true);
    setIsLoading(false);
  };

  const handleConnect = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI; // Callback para a Edge Function
    const scope = 'https://www.googleapis.com/auth/calendar.events.readonly';
    
    // O state será usado para passar o userId para a Edge Function de callback
    const state = userId; 

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`;

    window.location.href = authUrl;
  };

  if (isLoading) return <div className="p-mx-md text-center">Verificando conexão com Google Calendar...</div>;

  return (
    <div className="bg-white rounded-mx-xl shadow-mx-sm border border-border-default p-mx-lg">
      <div className="flex items-center justify-between mb-mx-lg">
        <div className="flex items-center gap-mx-sm">
          <div className="p-mx-xs bg-mx-indigo-50 text-brand-primary rounded-mx-lg">
            <Calendar size={24} />
          </div>
          <div>
            <Typography variant="h3" className="text-text-primary font-bold">
              Gestão de Agendas
            </Typography>
            <Typography variant="caption" className="text-text-tertiary">
              Sincronização com Google Calendar API
            </Typography>
          </div>
        </div>
        
        {isConnected && (
          <Button variant="outline" size="sm" className="flex items-center gap-mx-xs">
            <RefreshCcw size={16} />
            Atualizar
          </Button>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-mx-xl border-2 border-dashed border-border-default rounded-mx-xl">
          <Typography variant="p" className="text-text-secondary mb-mx-lg">
            Conecte sua agenda do Google para gerenciar compromissos com este cliente.
          </Typography>
          <Button 
            onClick={handleConnect}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white flex items-center gap-mx-xs mx-auto"
          >
            <ExternalLink size={18} />
            Conectar Google Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-mx-sm">
          <div className="p-mx-md bg-status-success-surface text-status-success rounded-mx-lg border border-status-success/20 flex items-center gap-mx-xs">
            <Typography variant="caption" className="font-medium">
              Agenda Conectada! Sincronizando eventos...
            </Typography>
          </div>
          
          {/* Listagem de eventos será implementada aqui na CONS-02.2 */}
          <div className="p-mx-lg text-center text-text-tertiary opacity-40">
            <Typography variant="caption">
              Nenhum evento futuro encontrado para este cliente.
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
};

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

  if (isLoading) return <div className="p-4 text-center">Verificando conexão com Google Calendar...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <Typography variant="h3" className="text-gray-900 font-bold">
              Gestão de Agendas
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              Sincronização com Google Calendar API
            </Typography>
          </div>
        </div>
        
        {isConnected && (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCcw size={16} />
            Atualizar
          </Button>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
          <Typography variant="body1" className="text-gray-600 mb-6">
            Conecte sua agenda do Google para gerenciar compromissos com este cliente.
          </Typography>
          <Button 
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 mx-auto"
          >
            <ExternalLink size={18} />
            Conectar Google Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 flex items-center gap-2">
            <Typography variant="body2" className="font-medium">
              Agenda Conectada! Sincronizando eventos...
            </Typography>
          </div>
          
          {/* Listagem de eventos será implementada aqui na CONS-02.2 */}
          <div className="p-12 text-center text-gray-400">
            <Typography variant="body2">
              Nenhum evento futuro encontrado para este cliente.
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
};

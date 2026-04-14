import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/atoms/Button';
import { Typography } from '../../../components/atoms/Typography';
import { supabase } from '../../../lib/supabase';
import { Calendar, RefreshCcw, ExternalLink, Clock, MapPin } from 'lucide-react';

interface GoogleCalendarViewProps {
  clientId: string;
  userId: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
}

export const GoogleCalendarView: React.FC<GoogleCalendarViewProps> = ({ clientId, userId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('consulting_oauth_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    setIsConnected(!!data);
    setIsLoading(false);
  }, [userId]);

  const fetchEvents = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, maxResults: 15 }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch events');
      setEvents(result.events || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (isConnected) fetchEvents();
  }, [isConnected, fetchEvents]);

  const handleConnect = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    const scope = 'https://www.googleapis.com/auth/calendar.events.readonly';
    const state = userId;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`;

    window.location.href = authUrl;
  };

  const formatEventTime = (start: CalendarEvent['start']) => {
    if (start.dateTime) {
      return new Date(start.dateTime).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (start.date) {
      return new Date(start.date + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      });
    }
    return '';
  };

  if (isLoading) return <div className="p-mx-md text-center text-text-tertiary">Verificando conexao com Google Calendar...</div>;

  return (
    <div className="bg-white rounded-mx-xl shadow-mx-sm border border-border-default p-mx-lg">
      <div className="flex items-center justify-between mb-mx-lg">
        <div className="flex items-center gap-mx-sm">
          <div className="p-mx-xs bg-mx-indigo-50 text-brand-primary rounded-mx-lg">
            <Calendar size={24} />
          </div>
          <div>
            <Typography variant="h3" className="text-text-primary font-bold">
              Gestao de Agendas
            </Typography>
            <Typography variant="caption" className="text-text-tertiary">
              Sincronizacao com Google Calendar API
            </Typography>
          </div>
        </div>

        {isConnected && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-mx-xs"
            onClick={fetchEvents}
            disabled={isRefreshing}
          >
            <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
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
              Agenda Conectada! {events.length > 0 ? `${events.length} evento(s) futuro(s).` : ''}
            </Typography>
          </div>

          {error && (
            <div className="p-mx-md bg-status-error-surface text-status-error rounded-mx-lg border border-status-error/20">
              <Typography variant="caption">{error}</Typography>
            </div>
          )}

          {isRefreshing && events.length === 0 && (
            <div className="p-mx-lg text-center text-text-tertiary">
              <RefreshCcw size={20} className="animate-spin mx-auto mb-mx-xs" />
              <Typography variant="caption">Buscando eventos...</Typography>
            </div>
          )}

          {!isRefreshing && events.length === 0 && !error && (
            <div className="p-mx-lg text-center text-text-tertiary opacity-60">
              <Typography variant="caption">
                Nenhum evento futuro encontrado para este cliente nos proximos 30 dias.
              </Typography>
            </div>
          )}

          {events.length > 0 && (
            <div className="space-y-mx-xs">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-mx-sm p-mx-md rounded-mx-lg border border-border-default hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors"
                >
                  <div className="p-mx-xs bg-brand-primary/10 rounded-mx-md mt-0.5">
                    <Clock size={14} className="text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Typography variant="caption" className="font-bold text-text-primary block truncate">
                      {event.summary || '(Sem titulo)'}
                    </Typography>
                    <Typography variant="caption" className="text-text-tertiary block">
                      {formatEventTime(event.start)}
                    </Typography>
                    {event.location && (
                      <div className="flex items-center gap-mx-xs mt-mx-xs">
                        <MapPin size={12} className="text-text-tertiary shrink-0" />
                        <Typography variant="caption" className="text-text-tertiary truncate">
                          {event.location}
                        </Typography>
                      </div>
                    )}
                  </div>
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary hover:text-brand-primary-hover shrink-0"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

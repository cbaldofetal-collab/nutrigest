import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dashboard, Widget } from '../types/chart.types';

interface DashboardStore {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setDashboards: (dashboards: Dashboard[]) => void;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createDashboard: (name: string, description?: string) => void;
  updateDashboard: (dashboardId: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (dashboardId: string) => void;
  addWidget: (widget: Widget) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  removeWidget: (widgetId: string) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      dashboards: [],
      currentDashboard: null,
      isLoading: false,
      error: null,

      setDashboards: (dashboards: Dashboard[]) => {
        set({ dashboards });
      },

      setCurrentDashboard: (dashboard: Dashboard | null) => {
        set({ currentDashboard: dashboard });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      createDashboard: (name: string, description?: string) => {
        const newDashboard: Dashboard = {
          id: Date.now().toString(),
          name,
          description,
          config: {
            layout: 'grid',
            columns: 12,
            theme: 'light',
            autoRefresh: false,
            refreshInterval: 60
          },
          widgets: [],
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({ 
          dashboards: [...state.dashboards, newDashboard],
          currentDashboard: newDashboard
        }));
      },

      updateDashboard: (dashboardId: string, updates: Partial<Dashboard>) => {
        set((state) => ({
          dashboards: state.dashboards.map(d => 
            d.id === dashboardId 
              ? { ...d, ...updates, updatedAt: new Date() }
              : d
          ),
          currentDashboard: state.currentDashboard?.id === dashboardId
            ? { ...state.currentDashboard, ...updates, updatedAt: new Date() }
            : state.currentDashboard
        }));
      },

      deleteDashboard: (dashboardId: string) => {
        set((state) => ({
          dashboards: state.dashboards.filter(d => d.id !== dashboardId),
          currentDashboard: state.currentDashboard?.id === dashboardId 
            ? null 
            : state.currentDashboard
        }));
      },

      addWidget: (widget: Widget) => {
        set((state) => {
          if (!state.currentDashboard) return state;
          
          const updatedDashboard = {
            ...state.currentDashboard,
            widgets: [...state.currentDashboard.widgets, widget],
            updatedAt: new Date()
          };
          
          return {
            currentDashboard: updatedDashboard,
            dashboards: state.dashboards.map(d => 
              d.id === updatedDashboard.id ? updatedDashboard : d
            )
          };
        });
      },

      updateWidget: (widgetId: string, updates: Partial<Widget>) => {
        set((state) => {
          if (!state.currentDashboard) return state;
          
          const updatedDashboard = {
            ...state.currentDashboard,
            widgets: state.currentDashboard.widgets.map(w => 
              w.id === widgetId ? { ...w, ...updates } : w
            ),
            updatedAt: new Date()
          };
          
          return {
            currentDashboard: updatedDashboard,
            dashboards: state.dashboards.map(d => 
              d.id === updatedDashboard.id ? updatedDashboard : d
            )
          };
        });
      },

      removeWidget: (widgetId: string) => {
        set((state) => {
          if (!state.currentDashboard) return state;
          
          const updatedDashboard = {
            ...state.currentDashboard,
            widgets: state.currentDashboard.widgets.filter(w => w.id !== widgetId),
            updatedAt: new Date()
          };
          
          return {
            currentDashboard: updatedDashboard,
            dashboards: state.dashboards.map(d => 
              d.id === updatedDashboard.id ? updatedDashboard : d
            )
          };
        });
      }
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        dashboards: state.dashboards
      })
    }
  )
);
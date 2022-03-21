import createStore from 'zustand';
import { persist } from 'zustand/middleware';
import { StorageConfig } from '@/config/storage';

type TPollingOption = number;
type TState = {
  pollingInterval: TPollingOption;
  shouldFetchData: boolean;
  shouldUseWebsocket: boolean;
  textSearchPollingDisabled: boolean;
  disablePolling: boolean;

  toggleShouldFetchData: () => void;
  toggleShouldUseWebsocket: () => void;
  toggleTextSearchPollingDisabled: () => void;
  changePollingInterval: (pollingInterval: TPollingOption) => void;
};
export const useNetworkSettingsStore = createStore<TState>(
  persist(
    (set) => ({
      shouldFetchData: true,
      shouldUseWebsocket: false,
      pollingInterval: 5000,
      disablePolling: false,
      
      textSearchPollingDisabled: true,

      changePollingInterval: (pollingInterval) => set({ pollingInterval }),
      toggleTextSearchPollingDisabled: () =>
        set(({ textSearchPollingDisabled }) =>
          set({ textSearchPollingDisabled: !textSearchPollingDisabled })
        ),
      toggleShouldFetchData: () =>
        set(({ shouldFetchData }) => ({ shouldFetchData: !shouldFetchData })),
      toggleShouldUseWebsocket: () =>
        set(({ shouldUseWebsocket }) => {
          return {
            disablePolling: !shouldUseWebsocket,
            shouldUseWebsocket: !shouldUseWebsocket,
            pollingInterval: 5000,
          };
        }),
    }),
    {
      name: `${StorageConfig.persistNs}network`,
      version: 1,
    }
  )
);
export const getPollingInterval = () => {
  const interval = useNetworkSettingsStore((state) => state.pollingInterval);
  return interval ? interval : false;
};

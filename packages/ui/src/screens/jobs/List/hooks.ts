import { useNetwork } from '@/hooks/use-network';
import { QueryKeysConfig } from '@/config/query-keys';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import shallow from 'zustand/shallow';
import { usePaginationStore } from '@/stores/pagination';
import {
  getPollingInterval,
  useNetworkSettingsStore,
} from '@/stores/network-settings';
import { useRefetchJobsLockStore } from '@/stores/refetch-jobs-lock';
import { useAtomValue } from 'jotai/utils';
import {
  activePageAtom,
  activeQueueAtom,
  activeStatusAtom,
  dataSearchAtom,
  jobIdAtom,
  jobsOrderAtom,
} from '@/atoms/workspaces';
import { useWebsocket } from '@/hooks/use-websocket';
import type { GetJobsQuery, JobStatus } from '@/typings/gql';

export const useJobsQuery = () => {
  const {
    queries: { getJobs },
  } = useNetwork();

  const page = useAtomValue(activePageAtom);
  const perPage = usePaginationStore((state) => state.perPage);
  const status = useAtomValue(activeStatusAtom) as JobStatus;
  const queue = useAtomValue(activeQueueAtom) as string;
  const order = useAtomValue(jobsOrderAtom);
  const jobId = useAtomValue(jobIdAtom);
  const dataSearch = useAtomValue(dataSearchAtom);
  const isFetchLocked = useRefetchJobsLockStore((state) => state.isLocked);
  const [shouldFetchData, textSearchPollingDisabled] = useNetworkSettingsStore(
    (state) => [state.shouldFetchData, state.textSearchPollingDisabled],
    shallow
  );
  const refetchInterval = getPollingInterval();

  const queryKey = [
    QueryKeysConfig.jobsList,
    {
      queue,
      perPage,
      page,
      status,
      order,
      id: jobId,
      dataSearch,
      shouldFetchData,
    }
  ];

  const queryClient = useQueryClient();

  const { listen, format } = useWebsocket();

  const mutation = useMutation<void, unknown, { job: any, action: 'delete' | 'update' | 'create' }, unknown>(async (params) => {
    queryClient.setQueryData<GetJobsQuery>(queryKey, (old) => {
      let jobs = old!.jobs.map(job => format.job(job, status));

      if(params.action === 'create'){
        jobs.unshift(format.job(params.job, status));
      }
      else if(params.action === 'delete'){
        const jobIndex = jobs.findIndex(job => job.id === params.job.id);
        if(jobIndex !== -1){
          jobs.splice(jobIndex, 1);
        }
      }
      else if(params.action === 'update'){
        const jobIndex = jobs.findIndex(job => job.id === params.job.id);
        if(jobIndex !== -1){
          jobs[jobIndex] = format.job(params.job, status);
        }
      }

      return { jobs: jobs };
    });
  });

  return useQuery(
    queryKey,
    () => getJobs({
      queue,
      limit: perPage,
      offset: page * perPage,
      status,
      order,
      id: jobId,
      fetchData: shouldFetchData,
      dataSearch: dataSearch,
    }).then(query => {
      listen.jobStatus(mutation, queue, status);
      return query;
    }),
    {
      keepPreviousData: true,
      enabled: Boolean(queue),
      refetchInterval:
        isFetchLocked || (textSearchPollingDisabled && dataSearch)
          ? false
          : refetchInterval,
    }
  );
};

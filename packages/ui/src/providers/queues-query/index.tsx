import { QueryKeysConfig } from '@/config/query-keys';
import { useNetwork } from '@/hooks/use-network';
import type { GetQueuesQuery } from '@/typings/gql';
import React from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import type { UseQueryResult } from 'react-query';
import { getPollingInterval } from '@/stores/network-settings';
import { useWebsocket } from '@/hooks/use-websocket';
import type { QueueCallback } from '../websocket/value';

type TValue = UseQueryResult<GetQueuesQuery, unknown>;
export const QueuesQueryContext = React.createContext<TValue>(null as any);
export const QueuesQueryProvider: React.FC = (props) => {
  const { queries } = useNetwork();
  const refetchInterval = getPollingInterval();
  const value = useQuery(QueryKeysConfig.queues, queries.getQueues, {
    refetchInterval,
  });

  const queryClient = useQueryClient();

  const { listen, format } = useWebsocket();

  const mutation = useMutation<void, unknown, QueueCallback, unknown>(async (params) => {
    queryClient.setQueryData<GetQueuesQuery>(QueryKeysConfig.queues, (old) => {
      let queueIndex = old!.queues!.findIndex(queue => queue.id === params.queue.id);

      let queues = old!.queues!.map((queue: any, index) => {
        if(index === queueIndex)
          return format.queue(queue, params.queue);

        return format.queue(queue);
      });

      return { queues: queues };
    });
  });
  
  listen.queues((param) => mutation.mutate(param));

  return (
    <QueuesQueryContext.Provider value={value}>
      {props.children}
    </QueuesQueryContext.Provider>
  );
};

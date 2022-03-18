import type { Job, JobLogs } from '@/typings/gql';
import type { UseMutationResult } from 'react-query';
import io from 'socket.io-client';

const socket = io();

const listeners = {
	jobs: [] as string[],
	logs: [] as string[],
};	

function buildEventName(queue: string, status: string, jobId?: string){
	return `queues.${queue}.jobs.${jobId ? `${jobId}.` : ''}${status}`;
}

function listenSocket<Param>(event: string, type: keyof typeof listeners, callback: (param: Param) => any){
	listeners[type].push(event);
	socket.on(event, callback);
}

const listen = {
	jobStatus(mutation: UseMutationResult<void, unknown, { job: Job, action: 'delete' | 'update' | 'create' }, unknown>, queue: string, status: Job['status']){
		while(listeners.jobs.length){
			const event = listeners.jobs.pop();
			socket.removeAllListeners(event);
		}
		
		if(status !== 'completed')
			listenSocket<{ job: Job }>(buildEventName(queue, 'completed'), 'jobs', ({ job }) => mutation.mutate({ job, action: 'delete' }));

		listenSocket<{ job: Job }>(buildEventName(queue, `${status}.progress`), 'jobs', ({ job }) => mutation.mutate({ job, action: 'update' }));
		listenSocket<{ job: Job }>(buildEventName(queue, status), 'jobs', ({ job }) => mutation.mutate({ job, action: 'create' }));
		
	},

	jobLogs(jobIdentifier: { id: string, queue: string }){
		while(listeners.logs.length){
			const event = listeners.logs.pop();
			socket.removeAllListeners(event);
		}

		listenSocket<{ log: JobLogs }>(buildEventName(jobIdentifier.queue, 'logs', jobIdentifier.id), 'logs', ({ log }) => {
			console.log("LOG", log);
		});
	}
}

const format = {
	job(socketJob: Job, status: Job['status']){
		return {
			...socketJob,
			status: socketJob.status || status,
		}
	}
}

export const websocketContextValue = { socket, listen, format };

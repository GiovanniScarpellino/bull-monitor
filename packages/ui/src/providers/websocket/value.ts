import type { Job, JobLogs, Queue } from '@/typings/gql';
import type { UseMutationResult } from 'react-query';
import io from 'socket.io-client';

const socket = io();

const listeners = {
	jobs: [] as string[],
	logs: [] as string[],
	queues: [] as string[],
};	

export interface QueueCallback { queue: Queue, action: 'create' | 'delete' | 'update' };

function buildEventName(queue: string, status: string, jobId?: string){
	return `queues.${queue}.jobs.${jobId ? `${jobId}.` : ''}${status}`;
}

function listenSocket<Param>(event: string, type: keyof typeof listeners, callback: (param: Param) => any){
	listeners[type].push(event);
	socket.on(event, callback);
}

const listen = {
	jobs(queue: string, status: Job['status'], callback: (param: { job: Job, action: 'create' | 'delete' | 'update' }) => void){
		while(listeners.jobs.length){
			const event = listeners.jobs.pop();
			socket.removeAllListeners(event);
		}
		
		if(status !== 'completed')
			listenSocket<{ job: Job }>(buildEventName(queue, 'completed'), 'jobs', ({ job }) => callback({ job, action: 'delete' }));

		listenSocket<{ job: Job }>(buildEventName(queue, `${status}.progress`), 'jobs', ({ job }) => callback({ job, action: 'update' }));
		listenSocket<{ job: Job }>(buildEventName(queue, status), 'jobs', ({ job }) => callback({ job, action: 'create' }));
		
	},

	queues(callback: (param: QueueCallback) => void){
		while(listeners.queues.length){
			const event = listeners.queues.pop();
			socket.removeAllListeners(event);
		}

		listenSocket<{ queue: Queue }>('queues.update', 'queues', ({ queue }) => {
			callback({ queue: queue, action: 'update' });
		});
	},

	logs(jobIdentifier: { id: string, queue: string }, callback: (log: Pick<JobLogs, 'logs' | 'count'>) => void){
		while(listeners.logs.length){
			const event = listeners.logs.pop();
			socket.removeAllListeners(event);
		}

		listenSocket<{ log: JobLogs }>(buildEventName(jobIdentifier.queue, 'logs', jobIdentifier.id), 'logs', ({ log }) => {
			callback(log);
		});
	},
}

const format = {
	job(socketJob: Job, status: Job['status']){
		return {
			...socketJob,
			status: socketJob.status || status,
		}
	},
	queue(socketQueue: Queue, queue?: Queue){
		return {
			...socketQueue,
			...(queue || {}),
		}
	}
}

export const websocketContextValue = { socket, listen, format };

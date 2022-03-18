import { WebsocketContext } from '@/providers/websocket';
import React from 'react';

export const useWebsocket = () => React.useContext(WebsocketContext);
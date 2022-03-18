import React from 'react';
import { websocketContextValue } from './value';

export const WebsocketContext = React.createContext(websocketContextValue);

export const NetworkProvider: React.FC = (props) => {
  return (
    <WebsocketContext.Provider value={websocketContextValue}>
      {props.children}
    </WebsocketContext.Provider>
  );
};

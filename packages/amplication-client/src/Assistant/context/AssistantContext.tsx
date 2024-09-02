import React, { useState } from "react";
import useAssistant, {
  AssistantMessageWithOptions,
} from "../hooks/useAssistant";
import { ApolloError } from "@apollo/client";
import * as Models from "../../models";

export interface AssistantMessagesInterface {
  messages: AssistantMessageWithOptions[];
  streamError: ApolloError;
  processingMessage: boolean;
  sendMessage: (
    message: string,
    messageType?: Models.EnumAssistantMessageType,
    assistantType?: Models.EnumAssistantType,
    privatePluginId?: string
  ) => void;
}

export interface AssistantContextInterface extends AssistantMessagesInterface {
  open: boolean;
  setOpen: (open: boolean) => void;
  widthState: string;
  setWidthState: (widthState: "default" | "wide") => void;
  sendOnboardingMessage: (message: string) => void;
}

const initialContext: AssistantContextInterface = {
  open: false,
  setOpen: () => {},
  widthState: "default",
  setWidthState: () => {},
  sendMessage: () => {},
  sendOnboardingMessage: () => {},
  messages: [],
  streamError: null,
  processingMessage: false,
};

export const AssistantContext =
  React.createContext<AssistantContextInterface>(initialContext);

export const AssistantContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [widthState, setWidthState] = useState<string>("default");

  const {
    sendMessage,
    sendOnboardingMessage,
    messages,
    streamError,
    processingMessage,
  } = useAssistant();

  const contextValue = {
    open,
    setOpen,
    widthState,
    setWidthState,
    sendMessage,
    sendOnboardingMessage,
    messages,
    streamError,
    processingMessage,
  };

  return (
    <AssistantContext.Provider value={contextValue}>
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistantContext = () => {
  const context = React.useContext(AssistantContext);
  if (context === undefined)
    throw Error(
      "useAssistantContext must be used within a AssistantContextProvider"
    );

  return context;
};

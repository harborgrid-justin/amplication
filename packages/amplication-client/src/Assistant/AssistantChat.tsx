import {
  EnumContentAlign,
  EnumFlexDirection,
  EnumGapSize,
  EnumItemsAlign,
  EnumTextAlign,
  EnumTextColor,
  EnumTextStyle,
  FlexItem,
  Text,
} from "@amplication/ui/design-system";
import { BillingFeature } from "@amplication/util-billing-types";
import { useStiggContext } from "@stigg/react-sdk";
import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/appContext";
import "./Assistant.scss";
import AssistantChatInput from "./AssistantChatInput";
import AssistantMessage from "./AssistantMessage";
import JovuLogo from "./JovuLogo";
import {
  AssistantMessagesInterface,
  useAssistantContext,
} from "./context/AssistantContext";
import "./AssistantChat.scss";
import { EnumAssistantMessageType, EnumAssistantType } from "../models";

export const CLASS_NAME = "assistant-chat";

interface Props extends AssistantMessagesInterface {
  showInput?: boolean;
  privatePluginId?: string;
}

const AssistantChat = ({
  showInput = true,
  privatePluginId,
  messages,
  sendMessage,
  processingMessage,
  streamError,
}: Props) => {
  const { currentWorkspace } = useAppContext();

  // const {
  //   sendMessage,
  //   messages,
  //   processingMessage: loading,
  //   streamError,
  // } = useAssistantContext();

  const { stigg } = useStiggContext();

  const { hasAccess } = stigg.getMeteredEntitlement({
    featureId: BillingFeature.JovuRequests,
  });

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sendChatMessage = useCallback(
    (message: string) => {
      if (privatePluginId) {
        sendMessage(
          message,
          EnumAssistantMessageType.Default,
          EnumAssistantType.PluginAgent,
          privatePluginId
        );
      } else {
        sendMessage(message);
      }
    },
    [privatePluginId, sendMessage]
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      {!hasAccess ? (
        <FlexItem
          direction={EnumFlexDirection.Column}
          itemsAlign={EnumItemsAlign.Center}
          contentAlign={EnumContentAlign.Center}
          gap={EnumGapSize.Large}
          className={`${CLASS_NAME}__limit`}
        >
          <JovuLogo />
          <Text textStyle={EnumTextStyle.H3} textAlign={EnumTextAlign.Center}>
            You have reached the daily limit of Jovu requests for your plan.
          </Text>
          <Text textStyle={EnumTextStyle.Tag} textAlign={EnumTextAlign.Center}>
            Upgrade now to keep using Jovu and unlock additional hidden
            functionalities.
          </Text>
          <Text
            textColor={EnumTextColor.White}
            textStyle={EnumTextStyle.Tag}
            textAlign={EnumTextAlign.Center}
          >
            <Link
              to={`/${currentWorkspace?.id}/purchase`}
              className={`${CLASS_NAME}__addon-section__contact-us`}
            >
              <Text
                textColor={EnumTextColor.ThemeTurquoise}
                textStyle={EnumTextStyle.Tag}
              >
                Upgrade Now
              </Text>
            </Link>
          </Text>
        </FlexItem>
      ) : currentWorkspace?.allowLLMFeatures ? (
        <>
          <div className={`${CLASS_NAME}__messages`}>
            {messages.map((message) => (
              <AssistantMessage
                key={message.id}
                message={message}
                onOptionClick={sendMessage}
              />
            ))}

            <div ref={messagesEndRef} />
            {streamError && (
              <div className={`${CLASS_NAME}__error`}>
                {streamError.message}
              </div>
            )}
          </div>

          {showInput && (
            <AssistantChatInput
              disabled={processingMessage}
              sendMessage={sendChatMessage}
            />
          )}
        </>
      ) : (
        <div className={`${CLASS_NAME}__messages`}>
          <div className={`${CLASS_NAME}__error`}>
            This feature is disabled for this workspace. To enable AI-powered
            features,{" "}
            <Link
              to={`/${currentWorkspace?.id}/settings`}
              className={`${CLASS_NAME}__settings-link`}
            >
              go to workspace settings.
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default AssistantChat;

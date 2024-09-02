import {
  CodeEditor,
  EnumFlexDirection,
  FlexItem,
} from "@amplication/ui/design-system";
import React, { useEffect, useState } from "react";
import { match, useRouteMatch } from "react-router-dom";
import AssistantChat from "../Assistant/AssistantChat";
import PageContent from "../Layout/PageContent";
import { AppRouteProps } from "../routes/routesUtil";
import PluginAgentFileExplorer from "./PluginAgentFileExplorer";
import usePrivatePlugin from "../PrivatePlugins/hooks/usePrivatePlugin";
import { useAppContext } from "../context/appContext";
import * as models from "../models";
import "./PluginAgentPage.scss";
import useAssistant from "../Assistant/hooks/useAssistant";

type Props = AppRouteProps & {
  match: match<{
    resource: string;
  }>;
};

const CLASS_NAME = "private-plugin-agent";

const PluginAgentPage: React.FC<Props> = ({ match, innerRoutes }: Props) => {
  const pageTitle = "Plugin Agent";

  const { currentResource } = useAppContext();
  const [selectedFile, setSelectedFile] =
    useState<models.PrivatePluginFile | null>(null);

  const privatePluginMatch = useRouteMatch<{ privatePluginId: string }>(
    "/:workspace/:project/:resource/plugin-agent/:privatePluginId"
  );

  let privatePluginId = null;
  if (privatePluginMatch) {
    privatePluginId = privatePluginMatch.params.privatePluginId;
  }

  const {
    getPrivatePluginFiles,
    getPrivatePluginFilesData: data,
    getPrivatePluginFilesError: error,
    getPrivatePluginFilesLoading: loading,
  } = usePrivatePlugin(currentResource?.id);

  useEffect(() => {
    if (!privatePluginId) return;
    getPrivatePluginFiles(privatePluginId);
  }, [privatePluginId, getPrivatePluginFiles]);

  const { messages, sendMessage, streamError, processingMessage } =
    useAssistant();

  return (
    <PageContent
      pageTitle={pageTitle}
      sideContent={
        <AssistantChat
          showInput
          privatePluginId={privatePluginId}
          messages={messages}
          sendMessage={sendMessage}
          streamError={streamError}
          processingMessage={processingMessage}
        />
      }
    >
      <FlexItem direction={EnumFlexDirection.Row} className={`${CLASS_NAME}`}>
        <div className={`${CLASS_NAME}__explorer`}>
          <PluginAgentFileExplorer
            privatePluginFiles={data?.privatePluginFiles}
            onFileSelected={setSelectedFile}
          />
        </div>
        <div className={`${CLASS_NAME}__editor`}>
          <CodeEditor
            height="100%"
            value={selectedFile?.content}
            options={{ readOnly: true }}
            path={selectedFile?.path}
          />
        </div>
      </FlexItem>
    </PageContent>
  );
};

export default PluginAgentPage;

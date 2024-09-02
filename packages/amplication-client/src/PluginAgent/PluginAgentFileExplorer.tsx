import React, { useCallback, useMemo } from "react";
import FileExplorer, { FileMeta } from "../Resource/code-view/FileExplorer";
import { NodeTypeEnum } from "../Resource/code-view/NodeTypeEnum";
import * as models from "../models";
import { clone } from "lodash";

type Props = {
  privatePluginFiles: models.PrivatePluginFile[];
  onFileSelected: (selectedFile: models.PrivatePluginFile) => void;
};

const INITIAL_ROOT_NODE: FileMeta = {
  type: NodeTypeEnum.Folder,
  name: "root",
  path: "/",
  children: [],
  expanded: true,
};

const PluginAgentFileExplorer: React.FC<Props> = ({
  privatePluginFiles,
  onFileSelected,
}: Props) => {
  const handleFileSelected = useCallback(
    (file: FileMeta) => {
      if (file.type === NodeTypeEnum.File) {
        const selectedFile = privatePluginFiles.find(
          (pluginFile) => pluginFile.path === file.path
        );
        if (selectedFile) {
          onFileSelected(selectedFile);
        }
      }
    },
    [privatePluginFiles, onFileSelected]
  );

  const rootNode = useMemo(() => {
    if (!privatePluginFiles) {
      return INITIAL_ROOT_NODE;
    }

    const root = {
      type: NodeTypeEnum.Folder,
      name: "root",
      path: "/",
      children: [],
      expanded: true,
    };

    privatePluginFiles.forEach((file) => {
      const parts = file.path.split("/");
      let currentLevel = root.children;
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath += (index > 0 ? "/" : "") + part;

        let existingNode = currentLevel.find((node) => node.name === part);

        if (!existingNode) {
          existingNode = {
            type:
              index === parts.length - 1
                ? NodeTypeEnum.File
                : NodeTypeEnum.Folder,
            name: part,
            path: currentPath,
            children: index === parts.length - 1 ? undefined : [],
            expanded: true,
          };
          currentLevel.push(existingNode);
        }

        if (
          existingNode.type === NodeTypeEnum.Folder &&
          existingNode.children
        ) {
          currentLevel = existingNode.children;
        }
      });
    });

    return root;
  }, [privatePluginFiles]);

  return (
    <FileExplorer rootFile={rootNode} onFileSelected={handleFileSelected} />
  );
};

export default PluginAgentFileExplorer;

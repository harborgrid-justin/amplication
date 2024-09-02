import { Icon, TreeView } from "@amplication/ui/design-system";
import { remove } from "lodash";
import { useCallback, useState } from "react";
import { FileExplorerNode } from "./FileExplorerNode";
import { NodeTypeEnum } from "./NodeTypeEnum";

export type FileMeta = {
  type: NodeTypeEnum;
  name: string;
  path: string;
  children?: FileMeta[] | undefined;
  expanded?: boolean;
};

type Props = {
  rootFile: FileMeta;
  onFileSelected: (selectedFile: FileMeta) => void;
};

const NO_FILES_MESSAGE = "There are no available files to show for this build";

const FileExplorer = ({ onFileSelected, rootFile }: Props) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const handleNodeClick = useCallback(
    async (file: FileMeta) => {
      const fileTypeMap = {
        [NodeTypeEnum.File]: () => {
          onFileSelected(file);
        },
        [NodeTypeEnum.Folder]: () => {
          const expandedNodes = [...expandedFolders];
          const removed = remove(expandedNodes, (item) => {
            return item === file.path;
          });
          if (!removed.length) {
            expandedNodes.push(file.path);
            file.expanded = true;
          } else {
            file.expanded = false;
          }
          setExpandedFolders(expandedNodes);
          onFileSelected(file);
        },
      };
      fileTypeMap[file.type]();
    },
    [onFileSelected, expandedFolders]
  );

  return (
    <div>
      {rootFile?.children?.length ? (
        <TreeView
          expanded={expandedFolders}
          defaultExpandIcon={<Icon icon="arrow_left" />}
          defaultCollapseIcon={<Icon icon="arrow_left" />}
        >
          {rootFile.children?.map((child) => (
            <FileExplorerNode
              file={child}
              key={child.path}
              onSelect={handleNodeClick}
            />
          ))}
        </TreeView>
      ) : (
        NO_FILES_MESSAGE
      )}
    </div>
  );
};

export default FileExplorer;

import { Snackbar } from "@amplication/ui/design-system";
import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Build } from "../../models";
import { formatError } from "../../util/error";
import "./CodeViewBar.scss";
import { FileMeta } from "./FileExplorer";
import { FileDetails } from "./CodeViewPage";
import FileExplorer from "./FileExplorer";
import { NodeTypeEnum } from "./NodeTypeEnum";
import { StorageBaseAxios, StorageResponseType } from "./StorageBaseAxios";

const CLASS_NAME = "code-view-bar";
const ERROR_MESSAGE_PREFIX = "Can't fetch files data from serer.";

type Props = {
  selectedBuild: Build;
  resourceId: string;
  onFileSelected: (selectedFile: FileDetails) => void;
};

const INITIAL_ROOT_NODE: FileMeta = {
  type: NodeTypeEnum.Folder,
  name: "root",
  path: "/",
  children: [],
  expanded: false,
};

const CodeViewExplorerTree = ({
  selectedBuild,
  resourceId,
  onFileSelected,
}: Props) => {
  const [rootFile, setRootFile] = useState<FileMeta>(INITIAL_ROOT_NODE);
  const [selectedFolder, setSelectedFolder] = useState<FileMeta>(rootFile);

  const { error, isError } = useQuery<StorageResponseType, AxiosError>(
    ["storage-folderList", selectedBuild.id, selectedFolder?.path],
    async () => {
      return await StorageBaseAxios.instance.folderList(
        resourceId,
        selectedBuild.id,
        selectedFolder?.path
      );
    },
    {
      onSuccess: (data) => {
        selectedFolder.children = data.result;
        setRootFile({ ...rootFile });
      },
    }
  );

  useEffect(() => {
    //reset the state when the build changes
    const newRootFile = { ...INITIAL_ROOT_NODE };
    setRootFile(newRootFile);
    setSelectedFolder(newRootFile);
  }, [selectedBuild]);

  const handleNodeClick = useCallback(
    async (file: FileMeta) => {
      const fileTypeMap = {
        [NodeTypeEnum.File]: () => {
          onFileSelected({
            buildId: selectedBuild.id,
            resourceId: resourceId,
            filePath: file.path,
            isFile: true,
            fileName: file.name,
          });
        },
        [NodeTypeEnum.Folder]: () => {
          setSelectedFolder(file);
        },
      };
      fileTypeMap[file.type]();
    },
    [selectedBuild, onFileSelected, resourceId]
  );

  const errorMessage = formatError(error);

  return (
    <div className={CLASS_NAME}>
      {selectedBuild && (
        <FileExplorer rootFile={rootFile} onFileSelected={handleNodeClick} />
      )}
      <Snackbar
        open={isError}
        message={`${ERROR_MESSAGE_PREFIX} ${errorMessage}`}
      />
    </div>
  );
};

export default CodeViewExplorerTree;

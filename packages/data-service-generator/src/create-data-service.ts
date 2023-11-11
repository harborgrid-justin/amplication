import { DSGResourceData, ModuleMap } from "@amplication/code-gen-types";
import normalize from "normalize-path";
import { createAdminModules } from "./admin/create-admin";
import DsgContext from "./dsg-context";
import { EnumResourceType } from "./models";
import { prepareContext } from "./prepare-context";
import { createServer } from "./server/create-server";
import { ILogger } from "@amplication/util/logging";
import { prepareDefaultPlugins } from "./utils/dynamic-installation/defaultPlugins";
import { dynamicPackagesInstallations } from "./dynamic-package-installation";
import { createDTOModules, createDTOs } from "./server/resource/create-dtos";
import { formatCode } from "@amplication/code-gen-utils";

export async function createDataService(
  dSGResourceData: DSGResourceData,
  internalLogger: ILogger,
  pluginInstallationPath?: string
): Promise<ModuleMap> {
  dSGResourceData.pluginInstallations = prepareDefaultPlugins(
    dSGResourceData.pluginInstallations
  );

  await dynamicPackagesInstallations(
    dSGResourceData.pluginInstallations,
    internalLogger
  );

  const context = DsgContext.getInstance;
  try {
    if (dSGResourceData.resourceType === EnumResourceType.MessageBroker) {
      internalLogger.info("No code to generate for a message broker");
      return null;
    }

    const startTime = Date.now();
    await prepareContext(
      dSGResourceData,
      internalLogger,
      pluginInstallationPath
    );

    const { GIT_REF_NAME: gitRefName, GIT_SHA: gitSha } = process.env;
    await context.logger.info(
      `Running DSG version: ${gitRefName} <${gitSha?.substring(0, 6)}>`
    );

    await context.logger.info("Creating application...", {
      resourceId: dSGResourceData.resourceInfo.id,
      buildId: dSGResourceData.buildId,
    });

    /**
     * Create (server) DTOs modules first, so that the DTOs are available for the rest of the modules (e.g. server, admin)
     */
    await context.logger.info("Creating DTOs...");
    const dtos = await createDTOs(context.entities);
    context.DTOs = dtos;
    const dtoModules = await createDTOModules(dtos);
    await context.logger.info("Formatting DTOs code...");
    await dtoModules.replaceModulesCode((path, code) => formatCode(path, code));

    // This code normalizes the path of each module to always use Unix path separator.
    await context.logger.info(
      "Normalizing modules path to use Unix path separator"
    );
    await modules.replaceModulesPath((path) => normalize(path));

    const endTime = Date.now();
    internalLogger.info("Application creation time", {
      durationInMs: endTime - startTime,
    });

    await context.logger.info(
      "Creating application process finished successfully"
    );

    return modules;
  } catch (error) {
    await internalLogger.error("Failed to run createDataService", {
      ...error,
    });
    throw error;
  }
}

import { AmplicationLogger } from "@amplication/util/nestjs/logging";
import { Injectable } from "@nestjs/common";
import { EnumBlockType } from "../../enums/EnumBlockType";
import { BlockService } from "../block/block.service";
import { BlockTypeService } from "../block/blockType.service";
import { CreatePrivatePluginArgs } from "./dto/CreatePrivatePluginArgs";
import { FindManyPrivatePluginArgs } from "./dto/FindManyPrivatePluginArgs";
import { PrivatePlugin } from "./dto/PrivatePlugin";
import { UpdatePrivatePluginArgs } from "./dto/UpdatePrivatePluginArgs";
import { DeletePrivatePluginArgs } from "./dto/DeletePrivatePluginArgs";
import { User } from "../../models";
import { BillingService } from "../billing/billing.service";
import { BillingFeature } from "@amplication/util-billing-types";
import { AmplicationError } from "../../errors/AmplicationError";
import { ResourceService } from "../resource/resource.service";
import { PrivatePluginFile } from "./dto/PrivatePluginFile";
import { join, normalize } from "path";
import { ConfigService } from "@nestjs/config";
import { Env } from "../../env";
import { outputFile, readdir, readFile } from "fs-extra";
import { GetPrivatePluginFilesArgs } from "./dto/GetPrivatePluginFilesArgs";
import { GetPrivatePluginFileContentArgs } from "./dto/GetPrivatePluginFileContentArgs";

type PlanStep = {
  step: string;
  status: "processed" | "pending";
};

@Injectable()
export class PrivatePluginService extends BlockTypeService<
  PrivatePlugin,
  FindManyPrivatePluginArgs,
  CreatePrivatePluginArgs,
  UpdatePrivatePluginArgs,
  DeletePrivatePluginArgs
> {
  blockType = EnumBlockType.PrivatePlugin;

  private baseFilesPath: string;

  constructor(
    protected readonly blockService: BlockService,
    protected readonly logger: AmplicationLogger,
    protected readonly billingService: BillingService,
    protected readonly resourceService: ResourceService,
    configService: ConfigService
  ) {
    super(blockService, logger);
    this.baseFilesPath = normalize(
      configService.get<string>(Env.BASE_PRIVATE_PLUGINS_FILES)
    );
  }

  //return all private plugins in the resource's project
  //disabled plugins can be used for setup - but should not be used in build time
  async availablePrivatePluginsForResource(
    args: FindManyPrivatePluginArgs
  ): Promise<PrivatePlugin[]> {
    const resource = await this.resourceService.resource({
      where: {
        id: args.where?.resource.id,
      },
    });

    if (!resource) {
      return [];
    }

    return await this.findMany({
      ...args,
      where: {
        ...args.where,
        resource: {
          projectId: resource.projectId,
        },
      },
    });
  }

  async create(
    args: CreatePrivatePluginArgs,
    user: User
  ): Promise<PrivatePlugin> {
    await this.validateLicense(user.workspace?.id);

    return super.create(args, user);
  }

  async validateLicense(workspaceId: string): Promise<void> {
    const entitlement = await this.billingService.getBooleanEntitlement(
      workspaceId,
      BillingFeature.PrivatePlugins
    );

    if (entitlement && !entitlement.hasAccess)
      throw new AmplicationError(
        `Feature Unavailable. Please upgrade your plan to use the Private Plugins Module.`
      );
  }

  async writePluginContent(
    pluginId: string,
    files: PrivatePluginFile[]
  ): Promise<void> {
    const path = normalize(`${this.baseFilesPath}/${pluginId}`);

    for (const file of files) {
      const fullPath = join(path, file.path);
      await outputFile(fullPath, file.content);
    }
  }

  async outlinePluginChanges(
    pluginId: string,
    changes: {
      change: string;
    }[]
  ): Promise<void> {
    const path = normalize(`${this.baseFilesPath}/${pluginId}/outline.json`);

    changes = changes.map((change) => ({
      ...change,
      status: "pending",
    }));

    await outputFile(path, JSON.stringify(changes, null, 2));
  }

  async getNextChangeForPluginOutline(
    pluginId: string
  ): Promise<PlanStep | null> {
    const path = normalize(`${this.baseFilesPath}/${pluginId}/outline.json`);

    const changes = await readFile(path, "utf8");

    try {
      const parsed: PlanStep[] = JSON.parse(changes);
      const nextChange = parsed.find((step) => step.status === "pending");
      if (!nextChange) {
        return null;
      }
      nextChange.status = "processed";
      await outputFile(path, JSON.stringify(parsed, null, 2));
      return nextChange;
    } catch (e) {
      return null;
    }
  }

  async planPluginCreation(
    pluginId: string,
    steps: {
      step: string;
    }[]
  ): Promise<void> {
    const path = normalize(`${this.baseFilesPath}/${pluginId}/plan.json`);

    steps = steps.map((step) => ({
      ...step,
      status: "pending",
    }));

    await outputFile(path, JSON.stringify(steps, null, 2));
  }

  async getNextStepForPluginPlan(pluginId: string): Promise<PlanStep | null> {
    const path = normalize(`${this.baseFilesPath}/${pluginId}/plan.json`);

    const steps = await readFile(path, "utf8");

    try {
      const parsed: PlanStep[] = JSON.parse(steps);
      const nextStep = parsed.find((step) => step.status === "pending");
      if (!nextStep) {
        return null;
      }
      nextStep.status = "processed";
      await outputFile(path, JSON.stringify(parsed, null, 2));
      return nextStep;
    } catch (e) {
      return null;
    }
  }

  async getPluginFileContent(
    args: GetPrivatePluginFileContentArgs
  ): Promise<PrivatePluginFile> {
    const path = normalize(join(this.baseFilesPath, args.where.id, args.path));
    const content = await readFile(path, "utf8");

    return {
      path: args.path,
      content: content,
    };
  }

  async getPluginFilesStructure(
    args: GetPrivatePluginFilesArgs
  ): Promise<PrivatePluginFile[]> {
    const path = normalize(`${this.baseFilesPath}/${args.where.id}`);

    const files = await this.readDirRecursive(path, join(path, "/"), false);

    return files.sort((a, b) => a.path.localeCompare(b.path));
  }

  async getPluginFiles(
    args: GetPrivatePluginFilesArgs
  ): Promise<PrivatePluginFile[]> {
    const path = normalize(`${this.baseFilesPath}/${args.where.id}`);

    const files = await this.readDirRecursive(path, join(path, "/"), true);

    return files.sort((a, b) => a.path.localeCompare(b.path));
  }

  async readDirRecursive(
    path: string,
    basePath: string,
    includeContent: boolean
  ): Promise<PrivatePluginFile[]> {
    let files: PrivatePluginFile[] = [];

    const items = await readdir(path, { withFileTypes: true });

    for (const item of items) {
      const fullPath = join(path, item.name);

      if (item.isDirectory()) {
        // If it's a directory, recursively read its contents
        const subFiles = await this.readDirRecursive(
          fullPath,
          basePath,
          includeContent
        );
        files = files.concat(subFiles);
      } else {
        const content = includeContent
          ? await readFile(fullPath, "utf8")
          : null;
        // If it's a file, add it to the files array
        files.push({
          path: fullPath.replace(basePath, ""),
          content: content,
        });
      }
    }

    return files;
  }
}

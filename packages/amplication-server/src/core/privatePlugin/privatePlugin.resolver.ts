import { UseFilters, UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";
import { GqlResolverExceptionsFilter } from "../../filters/GqlResolverExceptions.filter";
import { GqlAuthGuard } from "../../guards/gql-auth.guard";
import { BlockTypeResolver } from "../block/blockType.resolver";
import { CreatePrivatePluginArgs } from "./dto/CreatePrivatePluginArgs";
import { DeletePrivatePluginArgs } from "./dto/DeletePrivatePluginArgs";
import { FindManyPrivatePluginArgs } from "./dto/FindManyPrivatePluginArgs";
import { PrivatePlugin } from "./dto/PrivatePlugin";
import { UpdatePrivatePluginArgs } from "./dto/UpdatePrivatePluginArgs";
import { PrivatePluginService } from "./privatePlugin.service";
import { AuthorizeContext } from "../../decorators/authorizeContext.decorator";
import { AuthorizableOriginParameter } from "../../enums/AuthorizableOriginParameter";
import { PrivatePluginFile } from "./dto/PrivatePluginFile";
import { GetPrivatePluginFilesArgs } from "./dto/GetPrivatePluginFilesArgs";

@Resolver(() => PrivatePlugin)
@UseFilters(GqlResolverExceptionsFilter)
@UseGuards(GqlAuthGuard)
export class PrivatePluginResolver extends BlockTypeResolver(
  PrivatePlugin,
  "privatePlugins",
  FindManyPrivatePluginArgs,
  "createPrivatePlugin",
  CreatePrivatePluginArgs,
  "updatePrivatePlugin",
  UpdatePrivatePluginArgs,
  "deletePrivatePlugin",
  DeletePrivatePluginArgs
) {
  constructor(private readonly service: PrivatePluginService) {
    super();
  }

  @Query(() => [PrivatePlugin])
  @AuthorizeContext(AuthorizableOriginParameter.ResourceId, "where.resource.id")
  @UseGuards(GqlAuthGuard)
  async availablePrivatePluginsForResource(
    @Args() args: FindManyPrivatePluginArgs
  ): Promise<PrivatePlugin[]> {
    return this.service.availablePrivatePluginsForResource(args);
  }

  @Query(() => [PrivatePluginFile])
  @AuthorizeContext(AuthorizableOriginParameter.BlockId, "where.id")
  @UseGuards(GqlAuthGuard)
  async privatePluginFiles(
    @Args() args: GetPrivatePluginFilesArgs
  ): Promise<PrivatePluginFile[]> {
    return this.service.getPluginFiles(args);
  }
}

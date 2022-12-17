import { PrismaService } from "nestjs-prisma";

import {
  // @ts-ignore
  RELATED_ENTITY,
} from "@prisma/client";

declare class PARENT_ID_TYPE {}

export class Mixin {
  constructor(protected readonly prisma: PrismaService) {}

  async FIND_ONE(parentId: PARENT_ID_TYPE): Promise<RELATED_ENTITY | null> {
    return this.prisma.DELEGATE.findUnique({
      where: { id: parentId },
    }).PROPERTY();
  }
}

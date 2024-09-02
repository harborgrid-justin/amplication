import { Field, ObjectType } from "@nestjs/graphql";
import { IBlock } from "../../../models";

@ObjectType({
  isAbstract: true,
  implements: [IBlock],
})
export class PrivatePluginFile {
  @Field(() => String, {
    nullable: false,
  })
  path!: string;

  @Field(() => String, {
    nullable: false,
  })
  content!: string;
}

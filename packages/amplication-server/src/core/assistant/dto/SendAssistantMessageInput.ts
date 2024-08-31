import { Field, InputType } from "@nestjs/graphql";
import { EnumAssistantMessageType } from "./EnumAssistantMessageType";
import { EnumAssistantType } from "./EnumAssistantType";

@InputType()
export class SendAssistantMessageInput {
  @Field(() => String, {
    nullable: false,
  })
  message!: string;

  @Field(() => String, {
    nullable: true,
  })
  threadId?: string;

  @Field(() => EnumAssistantMessageType, {
    nullable: true,
  })
  messageType?: EnumAssistantMessageType;

  @Field(() => EnumAssistantType, {
    nullable: true,
  })
  assistantType?: EnumAssistantType;
}

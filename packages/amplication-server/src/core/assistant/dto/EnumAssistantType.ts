import { registerEnumType } from "@nestjs/graphql";

export enum EnumAssistantType {
  Jovu = "Jovu",
  PluginAgent = "PluginAgent",
}

registerEnumType(EnumAssistantType, {
  name: "EnumAssistantType",
});

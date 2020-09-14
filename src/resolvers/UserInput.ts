import { InputType, Field } from "type-graphql";

@InputType()
export class UserInput {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;
}

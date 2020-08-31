import { Resolver, Mutation, Arg, InputType, Field, Ctx, ObjectType, Query } from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";

@InputType()
class UserInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[]

  @Field(() => User, {nullable: true})
  user?: User
}

@Resolver()
export class UserResolver {
  @Query(() => User, {nullable: true})
  async me(@Ctx() {em, req}: MyContext) {
    if(!req.session.userId) {
      return null
    }

    const user = await em.findOne(User, {id: req.session.userId})

    return user
  }

  @Mutation(() => UserResponse)
  async rigister(@Arg("options") options: UserInput, @Ctx() { em, req }: MyContext): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "length must be greater than 2",
          },
        ],
      };
    }

    if (options.password.length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "length must be greater than 2",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
    } catch(err) {
      if (err.code === "23505") {
        //|| err.detail.includes("already exists")) {
        // duplicate username error
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }

    req.session.userId = user.id

    return {user};
  }

  @Mutation(() => UserResponse)
  async login(@Arg("options") options: UserInput, @Ctx() { em, req }: MyContext): Promise<UserResponse> {
    const user = await em.findOne(User, {username: options.username})

    if(!user) {
      return {
        errors: [
          {
            field: "username",
            message: "thst username doesn't exist",
          }
        ]
      }
    }

    const valid = await argon2.verify(user.password, options.password);
    
    if(!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          }
        ]
      }
    }

    req.session.userId = user.id

    return { user };
  }
}

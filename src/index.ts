import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"

import { __prod__ } from './constants'
import mikroConfig from './mikro-orm.config'
import { HelloResolver } from "./resolvers/hello"
import { PostResolver } from "./resolvers/post"
import { UserResolver } from "./resolvers/user"

const main = async () => {
  const orm = await MikroORM.init(mikroConfig)
  await orm.getMigrator().up()
  // const post = orm.em.create(Post, {title: "first post"})
  // await orm.em.persistAndFlush(post)

  // const posts = await orm.em.find(Post, {id: 3})

  // console.log(posts)

  const app = express()

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: () => ({ em: orm.em })
  })

  app.get('/', (_, res) => {
    res.send("Hello")
  })

  apolloServer.applyMiddleware({ app })

  app.listen(4000, () => {
    console.log("server is run localhost:4000")
  })
}

main().catch(err => {
  console.error(err)
})
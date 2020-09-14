import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"

import { __prod__, COOKIE_NAME } from './constants'
import mikroConfig from './mikro-orm.config'
import { HelloResolver } from "./resolvers/hello"
import { PostResolver } from "./resolvers/post"
import { UserResolver } from "./resolvers/user"
import cors from "cors"
import Redis from 'ioredis'
import session from 'express-session'
import connectRedis from "connect-redis"

const main = async () => {
  const orm = await MikroORM.init(mikroConfig)
  await orm.getMigrator().up()
  // const post = orm.em.create(Post, {title: "first post"})
  // await orm.em.persistAndFlush(post)

  // const posts = await orm.em.find(Post, {id: 3})

  // console.log(posts)

  const app = express()

  const RedisStore = connectRedis(session)
  const redis = new Redis()
  
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__ // cookie only works in https
      },
      saveUninitialized: false,
      secret: 'qwertyuiop',
      resave: false,
    })
  )

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res, redis })
  })

  // app.get('/', (_, res) => {
  //   res.send("Hello")
  // })

  apolloServer.applyMiddleware({ app, cors: false })

  app.listen(4000, () => {
    console.log("server is run localhost:4000")
  })
}

main().catch(err => {
  console.error(err)
})
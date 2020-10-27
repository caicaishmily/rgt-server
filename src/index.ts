import "reflect-metadata"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"
import cors from "cors"
import Redis from 'ioredis'
import session from 'express-session'
import connectRedis from "connect-redis"
import { createConnection } from "typeorm"
import path from "path"

import { __prod__, COOKIE_NAME } from './constants'
import { HelloResolver } from "./resolvers/hello"
import { PostResolver } from "./resolvers/post"
import { UserResolver } from "./resolvers/user"
import { Post } from "./entities/Post"
import { User } from "./entities/User"
import { Updoot } from "./entities/Updoot"
import { createUserLoader } from "./utils/createUserLoader"

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "rgt2",
    username: "postgres",
    password: "postgres",
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [User, Post, Updoot]
  })

  conn.runMigrations()

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
    context: ({ req, res }) => ({ req, res, redis, userLoader: createUserLoader(), })
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
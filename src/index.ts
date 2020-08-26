import { MikroORM } from "@mikro-orm/core"

import { __prod__ } from './constants'
import { Post } from "./entities/Post"
import mikroConfig from './mikro-orm.config'

const main = async () => {
  const orm = await MikroORM.init(mikroConfig)
  await orm.getMigrator().up()
  // const post = orm.em.create(Post, {title: "first post"})
  // await orm.em.persistAndFlush(post)

  // const posts = await orm.em.find(Post, {id: 3})
  // console.log(posts)
}

main().catch(err => {
  console.error(err)
})
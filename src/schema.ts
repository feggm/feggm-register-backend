import { nexusPrismaPlugin } from 'nexus-prisma'
import { makeSchema, objectType } from '@nexus/schema'
import path from 'path'

const Service = objectType({
  name: 'Service',
  definition (t) {
    t.model.id()
    t.model.serviceStartsAt()
    t.model.registrationStartsAt()
    t.model.numberOfAllowedVisitors()
    t.model.visitors({
      pagination: false
    })
  }
})

const Visitor = objectType({
  name: 'Visitor',
  definition (t) {
    t.model.id()
    t.model.name()
    t.model.street()
    t.model.zip()
    t.model.city()
    t.model.phone()
    t.model.email()
    t.model.service()
  }
})

const Query = objectType({
  name: 'Query',
  definition (t) {
    t.crud.service()
    t.crud.services()
    t.crud.visitor()
    t.crud.visitors()

    // t.list.field('feed', {
    //   type: 'Post',
    //   resolve: (_, args, ctx) => {
    //     return ctx.prisma.post.findMany({
    //       where: { published: true },
    //     })
    //   },
    // })

    // t.list.field('filterPosts', {
    //   type: 'Post',
    //   args: {
    //     searchString: stringArg({ nullable: true }),
    //   },
    //   resolve: (_, { searchString }, ctx) => {
    //     return ctx.prisma.post.findMany({
    //       where: {
    //         OR: [
    //           { title: { contains: searchString } },
    //           { content: { contains: searchString } },
    //         ],
    //       },
    //     })
    //   },
    // })
  }
})

const Mutation = objectType({
  name: 'Mutation',
  definition (t) {
    t.crud.createOneVisitor({ alias: 'createVisitor' })
    t.crud.createOneService({ alias: 'createService' })
    // t.crud.createOneUser({ alias: 'signupUser' })
    // t.crud.deleteOnePost()

    // t.field('createDraft', {
    //   type: 'Post',
    //   args: {
    //     title: stringArg({ nullable: false }),
    //     content: stringArg(),
    //     authorEmail: stringArg(),
    //   },
    //   resolve: (_, { title, content, authorEmail }, ctx) => {
    //     return ctx.prisma.post.create({
    //       data: {
    //         title,
    //         content,
    //         published: false,
    //         author: {
    //           connect: { email: authorEmail },
    //         },
    //       },
    //     })
    //   },
    // })

    // t.field('publish', {
    //   type: 'Post',
    //   nullable: true,
    //   args: {
    //     id: intArg(),
    //   },
    //   resolve: (_, { id }, ctx) => {
    //     return ctx.prisma.post.update({
    //       where: { id: Number(id) },
    //       data: { published: true },
    //     })
    //   },
    // })
  }
})

export const schema = makeSchema({
  types: [Query, Mutation, Service, Visitor],
  plugins: [nexusPrismaPlugin()],
  outputs: {
    schema: path.join(__dirname, '/../schema.graphql'),
    typegen: path.join(__dirname, '/generated/nexus.ts')
  },
  typegenAutoConfig: {
    contextType: 'Context.Context',
    sources: [
      {
        source: '@prisma/client',
        alias: 'prisma'
      },
      {
        source: require.resolve('./context'),
        alias: 'Context'
      }
    ]
  }
})

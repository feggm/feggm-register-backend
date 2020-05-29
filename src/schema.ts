import { nexusPrismaPlugin } from 'nexus-prisma'
import { makeSchema, objectType, fieldAuthorizePlugin, asNexusMethod, intArg, arg } from '@nexus/schema'
import path from 'path'
import _ from 'lodash'
import { GraphQLDate } from 'graphql-iso-date'

const DateTime = asNexusMethod(GraphQLDate, 'dateTime')

const Service = objectType({
  name: 'Service',
  definition (t) {
    t.model.id()
    t.model.serviceStartsAt()
    t.model.registrationStartsAt()
    t.model.numberOfAllowedVisitors()
    t.field('freePlaces', {
      type: 'Int',
      description: 'The number of places that are still left free',
      resolve: async (root, _args, ctx) =>
        root.numberOfAllowedVisitors - await ctx.prisma.visitor.count({ where: { serviceId: root.id } })
    })
    t.list.field('visitors', {
      type: 'Visitor',
      description: 'only authenticated admins can view visitors data',
      authorize: (_root, _args, ctx) => ctx.auth.isAdmin,
      resolve: async (root, _args, ctx) => await ctx.prisma.visitor.findMany({
        where: {
          serviceId: { equals: root.id }
        }
      })
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
    t.field('currentService', {
      type: 'Service',
      nullable: true,
      resolve: async (_root, _args, ctx) => {
        const now = new Date()
        return _.first(await ctx.prisma.service.findMany({
          where: {
            registrationStartsAt: { lt: now },
            serviceStartsAt: { gt: now }
          }
        })) || null
      }
    })
  }
})

const Mutation = objectType({
  name: 'Mutation',
  definition (t) {
    t.crud.createOneVisitor({ alias: 'createVisitor' })

    t.field('createService', {
      type: 'Service',
      authorize: (_root, _args, ctx) => ctx.auth.isAdmin,
      args: {
        serviceStartsAt: arg({ type: 'DateTime', nullable: false }),
        registrationStartsAt: arg({ type: 'DateTime', nullable: true }),
        numberOfAllowedVisitors: intArg({ nullable: false })
      },
      resolve: async (root, args, ctx) => await ctx.prisma.service.create({
        data: {
          ...args,
          serviceStartsAt: new Date(args.serviceStartsAt),
          registrationStartsAt: (args.registrationStartsAt && new Date(args.registrationStartsAt)) || new Date()
        }
      })
    })

    t.field('deleteService', {
      type: 'Service',
      authorize: (_root, _args, ctx) => ctx.auth.isAdmin,
      nullable: true,
      args: {
        id: intArg({ nullable: false })
      },
      resolve: async (_root, args, ctx) => {
        await ctx.prisma.visitor.deleteMany({ where: { serviceId: args.id } })
        const service = await ctx.prisma.service.delete({ where: { id: args.id } })
        return service
      }
    })
  }
})

export const schema = makeSchema({
  types: [Query, Mutation, Service, Visitor, DateTime],
  plugins: [nexusPrismaPlugin(), fieldAuthorizePlugin()],
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

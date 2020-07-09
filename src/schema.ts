import { nexusPrismaPlugin } from 'nexus-prisma'
import { makeSchema, objectType, fieldAuthorizePlugin, asNexusMethod, intArg, arg, stringArg, booleanArg } from '@nexus/schema'
import path from 'path'
import _ from 'lodash'
import { GraphQLDate } from 'graphql-iso-date'
import moment from 'moment'

const DateTime = asNexusMethod(GraphQLDate, 'dateTime')

const Service = objectType({
  name: 'Service',
  definition (t) {
    t.model.id()
    t.model.serviceStartsAt()
    t.model.registrationStartsAt()
    t.model.registrationEndsAt()
    t.model.additionalInfo()
    t.model.noDateConflict()
    t.model.numberOfAllowedVisitors()
    t.field('numberOfVisitors', {
      type: 'Int',
      description: 'The number of places that are already reserved',
      resolve: async (root, _args, ctx) =>
        await ctx.prisma.visitor.count({ where: { serviceId: root.id } })
    })
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
    t.model.surname()
    t.model.street()
    t.model.zip()
    t.model.city()
    t.model.phone()
    t.model.email()
    t.model.service()
  }
})

const Text = objectType({
  name: 'Text',
  definition (t) {
    t.model.id()
    t.model.key()
    t.model.value()
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
            serviceStartsAt: { gt: now },
            registrationEndsAt: { gt: now }
          }
        })) || null
      }
    })

    t.list.field('currentServices', {
      type: 'Service',
      nullable: true,
      resolve: async (_root, _args, ctx) => {
        const now = new Date()
        return await ctx.prisma.service.findMany({
          where: {
            registrationStartsAt: { lt: now },
            serviceStartsAt: { gt: now },
            registrationEndsAt: { gt: now }
          }
        }) || null
      }
    })

    t.list.field('services', {
      type: 'Service',
      authorize: (_root, _args, ctx) => ctx.auth.isAdmin,
      resolve: async (_root, _args, ctx) => await ctx.prisma.service.findMany()
    })

    t.list.field('texts', {
      type: 'Text',
      resolve: async (_root, _args, ctx) => await ctx.prisma.text.findMany()
    })

    t.field('text', {
      type: 'String',
      nullable: true,
      args: {
        key: stringArg({ nullable: false })
      },
      resolve: async (_root, args, ctx) => _.first(await ctx.prisma.text.findMany({
        select: { value: true },
        where: {
          key: args.key
        }
      }))?.value || ''
    })
  }
})

const Mutation = objectType({
  name: 'Mutation',
  definition (t) {
    t.list.field('createVisitor', {
      type: 'Visitor',
      args: {
        name: stringArg({ nullable: false }),
        surname: stringArg({ nullable: false }),
        street: stringArg({ nullable: false }),
        zip: stringArg({ nullable: false }),
        city: stringArg({ nullable: false }),
        phone: stringArg({ nullable: false }),
        email: stringArg({ nullable: true }),
        serviceIds: intArg({ nullable: false, list: true })
      },
      resolve: async (_root, args, ctx) => {
        const { serviceIds, ...data } = args
        const usedDates:Array<string> = []

        // pre loop for error checks
        for (const serviceId of serviceIds) {
          const service = await ctx.prisma.service.findOne({ where: { id: serviceId } })
          // check if we this is a valid service
          if (!service) {
            throw Error(`the service ${serviceId} does not exist`)
          }

          // check if the registration time is not yet over
          if (moment().isAfter(service.registrationEndsAt)) {
            throw Error(`the registration time for service ${serviceId} is over`)
          }

          // check, if the service is already full
          const numberOfVisitors = await ctx.prisma.visitor.count({ where: { serviceId } })
          if (!service || service.numberOfAllowedVisitors <= numberOfVisitors) {
            throw Error(`the service ${serviceId} has no places left`)
          }

          // make sure no other service of the user registration takes place at the same date
          if (!service.noDateConflict) {
            const dateCode = moment(service.serviceStartsAt).format('YYYY-MM-DD')
            if (_.includes(usedDates, dateCode)) {
              throw Error(`the service ${serviceId} takes place at the same date as another service`)
            }
            usedDates.push(dateCode)
          }
        }

        // go through each service and create it
        const visitorPromises = _.map(serviceIds, async serviceId => {
          return await ctx.prisma.visitor.create({
            data: {
              ...data,
              service: { connect: { id: serviceId } }
            }
          })
        })
        return await Promise.all(visitorPromises)
      }
    })

    t.field('createAnonymousVisitor', {
      type: 'Visitor',
      authorize: (_root, _args, ctx) => ctx.auth.isAdmin,
      args: {
        serviceId: intArg({ nullable: false })
      },
      resolve: async (_root, args, ctx) => {
        return await ctx.prisma.visitor.create({
          data: {
            name: '-',
            surname: '-',
            street: '-',
            zip: '-',
            city: '-',
            phone: '-',
            email: '-',
            service: { connect: { id: args.serviceId } }
          }
        })
      }
    })

    t.field('createService', {
      type: 'Service',
      authorize: (_root, _args, ctx) => ctx.auth.isAdmin,
      args: {
        serviceStartsAt: arg({ type: 'DateTime', nullable: false }),
        registrationStartsAt: arg({ type: 'DateTime', nullable: true }),
        registrationEndsAt: arg({ type: 'DateTime', nullable: true }),
        numberOfAllowedVisitors: intArg({ nullable: false }),
        additionalInfo: stringArg({ nullable: true }),
        noDateConflict: booleanArg({ nullable: true })
      },
      resolve: async (root, args, ctx) => await ctx.prisma.service.create({
        data: {
          ...args,
          noDateConflict: !!args.noDateConflict,
          serviceStartsAt: new Date(args.serviceStartsAt),
          registrationStartsAt: (args.registrationStartsAt && new Date(args.registrationStartsAt)) || new Date(),
          registrationEndsAt: (args.registrationEndsAt && new Date(args.registrationEndsAt)) || new Date(args.serviceStartsAt)
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

    t.field('setText', {
      type: 'Text',
      authorize: (_root, _args, ctx) => ctx.auth.isAdmin,
      args: {
        key: stringArg({ nullable: false }),
        value: stringArg({ nullable: false })
      },
      resolve: async (_root, args, ctx) => {
        const { id } = _.first(await ctx.prisma.text.findMany({
          first: 1,
          select: { id: true },
          where: { key: args.key }
        })) || { id: 0 }
        return await ctx.prisma.text.upsert({
          create: { ...args },
          update: { value: args.value },
          where: { id }
        })
      }
    })
  }
})

export const schema = makeSchema({
  types: [Query, Mutation, Service, Visitor, DateTime, Text],
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

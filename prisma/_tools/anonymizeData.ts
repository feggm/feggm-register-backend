import { PrismaClient, Service, Visitor } from '@prisma/client'
import moment from 'moment'
import _ from 'lodash'
import crypto from 'crypto'

const prisma = new PrismaClient()
const fourWeeksAgo = moment().subtract(4, 'weeks').toDate()

const anonymizeVisitor = async (visitor: Visitor) => {
  const fullName = `${visitor.name} ${visitor.surname}`
  const hashedName = crypto.createHash('sha256').update(fullName).digest('base64')
  await prisma.visitor.update({
    where: {
      id: visitor.id
    },
    data: {
      additionalData: {},
      city: '',
      email: '',
      isAnonymized: true,
      name: hashedName,
      phone: '',
      street: '',
      surname: '',
      zip: ''
    }
  })
}
const anonymizeService = async (service: Service) => {
  let visitors = []
  visitors = await prisma.visitor.findMany({
    where: {
      serviceId: service.id,
      isAnonymized: false
    }
  })

  const anonymizeVisitorPromises = _.map(visitors, visitor => anonymizeVisitor(visitor))
  await Promise.all(anonymizeVisitorPromises)

  await prisma.service.update({
    where: { id: service.id },
    data: {
      isAnonymized: true
    }
  })
}

const anonymize = async () => {
  // find all services that took place more than 4 weeks ago
  let servicesToAnonymize = []
  try {
    servicesToAnonymize = await prisma.service.findMany({
      where: {
        serviceStartsAt: {
          lte: fourWeeksAgo
        },
        isAnonymized: {
          equals: false
        }
      }
    })
  } catch (error) {
    console.error('Error fetching the services')
    console.error(error)
    process.exit(1)
  }

  try {
    const anonymizeServicePromises = _.map(servicesToAnonymize, service => anonymizeService(service))
    await Promise.all(anonymizeServicePromises)
  } catch (error) {
    console.error('Error updating the services')
    console.error(error)
    process.exit(2)
  }
}

anonymize().finally(() => prisma.disconnect())

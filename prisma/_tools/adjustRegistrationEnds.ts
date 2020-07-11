import { PrismaClient } from '@prisma/client'
import moment from 'moment'

const prisma = new PrismaClient()
const now = new Date()

const DIFF = moment.duration({
  seconds: 0,
  minutes: 15,
  hours: 1,
  days: 0
})

const adjust = async () => {
  // find all services that take place in the future
  const futureServices = await prisma.service.findMany({
    select: {
      id: true,
      registrationEndsAt: true,
      serviceStartsAt: true
    },
    where: {
      serviceStartsAt: {
        gt: now
      }
    }
  })

  // adjust the registrationEnds time according to the serviceStarts time
  const servicesAdjusted = futureServices.map(service => {
    let { registrationEndsAt, serviceStartsAt } = service
    registrationEndsAt = moment(serviceStartsAt).subtract(DIFF).toDate()
    return {
      ...service,
      registrationEndsAt
    }
  })

  // save the records
  const updatePromises = servicesAdjusted.map(service => prisma.service.update({
    where: {
      id: service.id
    },
    data: {
      registrationEndsAt: service.registrationEndsAt
    }
  }))

  await Promise.all(updatePromises)
}

adjust().finally(() => prisma.disconnect())

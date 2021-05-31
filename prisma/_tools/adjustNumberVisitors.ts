import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const now = new Date()

const NEW_VISITORS = 50

const adjust = async () => {
  // find all services that take place in the future
  const futureServices = await prisma.service.findMany({
    select: {
      id: true,
      numberOfAllowedVisitors: true,
      serviceStartsAt: true
    },
    where: {
      serviceStartsAt: {
        gt: now
      }
    }
  })

  // adjust the visitor number
  const servicesAdjusted = futureServices.map(service => {
    const { numberOfAllowedVisitors, id, serviceStartsAt } = service

    console.log(`${serviceStartsAt} (${id}): ${numberOfAllowedVisitors} → ${NEW_VISITORS}`)

    return {
      ...service,
      numberOfAllowedVisitors: NEW_VISITORS
    }
  })

  // save the records
  const updatePromises = servicesAdjusted.map(service => prisma.service.update({
    where: {
      id: service.id
    },
    data: {
      numberOfAllowedVisitors: service.numberOfAllowedVisitors
    }
  }))

  await Promise.all(updatePromises)
}

adjust().finally(() => prisma.disconnect())

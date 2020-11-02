import { PrismaClient } from '@prisma/client'
import moment from 'moment'
// import _ from 'lodash'

const prisma = new PrismaClient()
const fourWeeksAgo = moment().subtract(4, 'weeks').toDate()

const anonymize = async () => {
  // find all services that took place more than 4 weeks ago
  const servicesToAnonymize = await prisma.service.findMany({
    where: {
      serviceStartsAt: {
        lte: fourWeeksAgo
      },
      isAnonymized: {
        equals: false
      }
    }
  })

  console.log(servicesToAnonymize)
}

anonymize().finally(() => prisma.disconnect())

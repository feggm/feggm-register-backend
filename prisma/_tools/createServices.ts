import { PrismaClient } from '@prisma/client'
import moment from 'moment'
import _ from 'lodash'
import args from 'args'

args
  .option('visitors', 'Number of allowed visitors', 85)
  .option('start', 'Time of the start of the service', '10:30:00')
  .option('startRegister', 'Time of the start of the registration phase', '12:00:00')
  .option('endRegister', 'Time of the end of the registration phase', '09:30:00')
  .option('name', 'Optional name of the service', '')
  .option('add', 'Add services, even if services are existing already at specific dates', false)
  .example(
    'yarn create-services --visitors 85 --start 10:30 --startRegister 12:00 --endRegister 09:30 --name ""',
    'Creates services with the default settings'
  )

const flags = args.parse(process.argv, {
  name: 'yarn create-services',
  version: false,
  mri: {},
  mainColor: 'yellow',
  subColor: 'dim'
})

const prisma = new PrismaClient()
const now = new Date()

const createTimeObject = (timeString:string) => {
  timeString = moment().format('YYYY-MM-DD ') + timeString
  return {
    seconds: moment(timeString).seconds(),
    minutes: moment(timeString).minutes(),
    hours: moment(timeString).hours()
  }
}

const SERVICE_START = createTimeObject(flags.start)
const REGISTRATION_START = createTimeObject(flags.startRegister)
const REGISTRATION_END = createTimeObject(flags.endRegister)

const ALLOWED_VISITORS = flags.visitors

const create = async () => {
  // find all dates that services take place in the future
  const availableFutureServices = await prisma.service.findMany({
    select: {
      serviceStartsAt: true
    },
    where: {
      serviceStartsAt: {
        gt: now
      }
    }
  })
  const availableFutureServiceDates = _.map(availableFutureServices, service => moment(service.serviceStartsAt).format('YYYY-MM-DD'))

  // create an array of dates where we need to create services for
  let datesToCreate = _.times(53, week => moment().day(0).isoWeek(week).format('YYYY-MM-DD'))
  datesToCreate = _.filter(datesToCreate, date =>
    moment(date).isAfter(now) &&
    (!_.includes(availableFutureServiceDates, date) || !!flags.add)
  ) || []

  // create the services
  for (const dateToCreate of datesToCreate) {
    await prisma.service.create({
      data: {
        numberOfAllowedVisitors: ALLOWED_VISITORS,
        serviceStartsAt: moment(dateToCreate).set(SERVICE_START).toDate(),
        registrationEndsAt: moment(dateToCreate).set(REGISTRATION_END).toDate(),
        registrationStartsAt: moment(dateToCreate).subtract(7, 'days').set(REGISTRATION_START).toDate(),
        additionalInfo: flags.name
      }
    })
  }
}

create().finally(() => prisma.disconnect())

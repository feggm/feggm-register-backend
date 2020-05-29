import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import * as env from 'env-var'

require('dotenv').config()
const TOKEN:string = env.get('TOKEN').required().asString()

const prisma = new PrismaClient()

interface IntegrationContext {
  req: Request,
  res: Response
}

interface AuthClient {
  isAdmin: boolean
}

const auth = (integrationContext: IntegrationContext) => {
  return {
    isAdmin: integrationContext.req.header('Token') === TOKEN
  }
}

export interface Context {
  prisma: PrismaClient
  auth: AuthClient
}

export function createContext (integrationContext:IntegrationContext): Context {
  return { prisma, auth: auth(integrationContext) }
}

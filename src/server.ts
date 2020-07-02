import { ApolloServer } from 'apollo-server'
import { schema } from './schema'
import { createContext } from './context'
import * as env from 'env-var'

const port = env.get('PORT').default('4000').asPortNumber()

new ApolloServer({ schema, context: createContext, cors: true }).listen(
  { port },
  () =>
    console.log(
      `🚀 Server ready at: http://localhost:${port}\n⭐️ See sample queries: http://pris.ly/e/ts/graphql-apollo-server#using-the-graphql-api`
    )
)

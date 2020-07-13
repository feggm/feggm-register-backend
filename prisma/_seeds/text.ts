import { PrismaClient } from '@prisma/client'
import _ from 'lodash'

const prisma = new PrismaClient()

export const definitions = {
  appName: 'Gottesdienst Registrierung',
  freePlacePre: 'Noch',
  freePlacePost: 'freie Plätze',
  'initial.title': 'Herzlich Willkommen',
  'initial.subtitle': 'Registriere dich für die nächsten Gottesdienste',
  'initial.paragraph1': 'Du möchtest die nächsten Gottesdienste besuchen? Sobald du auf den unteren Button klickst, kannst du dich dafür registrieren.',
  'initial.labelService': 'Gottesdienst am',
  'initial.labelFreeSeats': 'Noch freie Plätze',
  'initial.paragraph2': 'Falls du dich lieber telefonisch anmelden möchtest, kannst du das gerne über unsere Anmeldehotline <a href="tel:+4922618071293" style="whitespace: nowrap;">📞02261 / 8071293</a > tun.',
  'initial.paragraph3': 'Nach der aktuellen Hygiene-Richtlinie können zwei Familien den <strong>Eltern-Kind-Raum</strong> nutzen. Wer diese Möglichkeit in Anspruch nehmen möchte, braucht sich nicht online registrieren. Die Vergabe der zwei Familien-Plätze erfolgt <strong>ausschließlich telefonisch</strong> über unsere Anmelde-Hotline.',
  'initial.noSeats': 'Zur Zeit stehen für die Buchung keine freien Plätze zur Verfügung.',
  'initial.buttonGo': 'Los gehts',
  'registration.title': 'Registrierung',
  'registration.subtitle': 'Für den Gottesdienst am',
  'registration.buttonBack': 'Zurück',
  'registration.buttonRegister': 'Registrieren',
  'registration.validationError': 'Bitte überprüfe deine Angaben',
  'finish.title': 'Vielen Dank',
  'finish.subtitle': 'Für deine Registrierung',
  'finish.paragraph': 'Wir haben deine Registrierung erfolgreich aufgenommen und freuen uns auf deinen Besuch. Hier noch einmal die wichtigsten Daten für dich:',
  'finish.labelName': 'Dein Name',
  'finish.labelAddress': 'Deine Adresse',
  'finish.labelPhone': 'Deine Telefonnummer',
  'finish.labelEmail': 'Deine E-Mail-Adresse',
  'finish.labelId': 'ID',
  'finish.labelService': 'Gottesdienst am',
  'finish.labelTime': 'Uhrzeit',
  'finish.hint': 'Bitte lies dir für deinen Besuch unbedingt auch unser <a href="https://www.feggm.de/wp-content/uploads/2020/06/Abstands-Hygieneregeln_FeGM_2020-06-01.pdf" target="_blank" style="whitespace: nowrap;">📄Hygienekonzept</a> durch. Vielen Dank.',
  'finish.buttonRestart': 'Zum Anfang'
}

export const seed = async (definitions: Record<string, string>): Promise<void> => {
  try {
    const texts = _.map(definitions, (value, key) => ({
      key,
      value
    }))

    // delete all keys that have been defined in the seed
    for (const { key } of texts) {
      await prisma.text.deleteMany({
        where: {
          key
        }
      })
    }

    // create the defined texts anew
    for (const text of texts) {
      await prisma.text.create({
        data: text
      })
    }
  } finally {
    prisma.disconnect()
  }
}

export const add = async (definitions: Record<string, string>): Promise<void> => {
  // receive all available texts
  const allTexts = await prisma.text.findMany()

  // transform to the same form as definitions
  const transformedAllTexts: Record<string, string|null> = {}
  for (const textItem of allTexts) {
    transformedAllTexts[textItem.key] = textItem.value
  }

  // merge them with the text definitions
  const mergedTextDefinitions = _.merge({}, definitions, transformedAllTexts)

  // save the merged text definitions
  await seed(mergedTextDefinitions)
}

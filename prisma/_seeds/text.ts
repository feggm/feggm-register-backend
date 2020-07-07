import { PrismaClient } from '@prisma/client'
import _ from 'lodash'

const prisma = new PrismaClient()

const textDefinitions = {
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
  'initial.noSeats': 'Es tut uns sehr leid, aber die verfügbaren Plätze für die nächsten Gottesdienste sind schon alle belegt. Schau doch nächste Woche noch mal vorbei...',
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
  'finish.labelId': 'Deine Registrierungs ID',
  'finish.labelService': 'Gottesdienst am',
  'finish.labelTime': 'Uhrzeit',
  'finish.hint': 'Bitte lies dir für deinen Besuch unbedingt auch unser <a href="https://www.feggm.de/wp-content/uploads/2020/06/Abstands-Hygieneregeln_FeGM_2020-06-01.pdf" target="_blank" style="whitespace: nowrap;">📄Hygienekonzept</a> durch. Vielen Dank.',
  'finish.buttonRestart': 'Zum Anfang'
}

const seed = async () => {
  const texts = _.map(textDefinitions, (value, key) => ({
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
}

seed().catch(err => {
  throw err
}).finally(() => {
  prisma.disconnect()
})

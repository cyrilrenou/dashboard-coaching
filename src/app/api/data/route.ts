import { Client } from '@notionhq/client'
import { NextResponse } from 'next/server'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const COACH_DB = '2f7574c4-a440-807f-93a8-eb661b7049b0'
const REUNIONS_DB = 'ccb3556f-e580-406f-b1c9-66f8fd96a862'

function getProp(page: any, name: string) {
  const prop = page.properties[name]
  if (!prop) return null
  if (prop.type === 'number') return prop.number
  if (prop.type === 'select') return prop.select?.name ?? null
  if (prop.type === 'rich_text') return prop.rich_text?.[0]?.plain_text ?? null
  if (prop.type === 'title') return prop.title?.[0]?.plain_text ?? null
  if (prop.type === 'date') return prop.date?.start ?? null
  return null
}

async function queryAll(database_id: string, sorts: any[]) {
  let results: any[] = []
  let cursor: string | undefined = undefined
  do {
    const res: any = await notion.databases.query({
      database_id,
      sorts,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    results = results.concat(res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return results
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const coachPages = await queryAll(COACH_DB, [{ property: 'Date de la réunion', direction: 'ascending' }])

    const coachData = coachPages.map((page: any) => ({
      id: page.id,
      nom: getProp(page, 'Réunion'),
      date: getProp(page, 'Date de la réunion'),
      semaine: getProp(page, 'Semaine'),
      scoreProgression: getProp(page, 'Score de progression'),
      scoreClarte: getProp(page, 'Score Clarté'),
      scoreConviction: getProp(page, 'Score Conviction'),
      scoreEcoute: getProp(page, 'Score Écoute'),
      scoreLeadership: getProp(page, 'Score Leadership'),
      scorePosture: getProp(page, 'Score Posture'),
      scoreSuivi: getProp(page, 'Score Suivi'),
      tempsParole: getProp(page, 'Temps de parole (%)'),
      evolution: getProp(page, 'Évolution vs réunions précédentes'),
      type: getProp(page, 'Type de réunion'),
      axesAmelioration: getProp(page, "Axes d'amélioration"),
      forcesObservees: getProp(page, 'Forces observées'),
      recommandation: getProp(page, '1 recommandation clé'),
    })).filter((d: any) => d.date)

    const reunionsPages = await queryAll(REUNIONS_DB, [{ property: 'Date réelle', direction: 'ascending' }])

    const reunionsData = reunionsPages.map((page: any) => ({
      id: page.id,
      nom: getProp(page, 'Name'),
      date: getProp(page, 'Date réelle'),
      semaine: getProp(page, 'Semaine'),
      scoreQualite: getProp(page, 'Score qualité'),
      qualiteGlobale: getProp(page, 'Qualité globale'),
      type: getProp(page, 'Type'),
      duree: getProp(page, 'Durée (min)'),
      niveauAlignement: getProp(page, 'Niveau alignement'),
      niveauDecision: getProp(page, 'Niveau de décision'),
    })).filter((d: any) => d.date && (d.scoreQualite !== null || d.qualiteGlobale !== null || d.duree !== null))

    return NextResponse.json({ coach: coachData, reunions: reunionsData })
  } catch (error: any) {
    console.error('Notion API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

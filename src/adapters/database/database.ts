import { QueryResult, QueryResultRow } from 'pg'

// convert snake case fields into camel case
export const snakeToCamel = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) =>
      letter.toUpperCase()
    )
    acc[camelKey] = obj[key]
    return acc
  }, {})
}

// parse query result
export const parseResult = <T extends QueryResultRow>(
  result: QueryResult<T>
): T | null => {
  if ((result.rowCount || 0) === 1) {
    return snakeToCamel(result.rows[0]) as T
  } else if ((result.rowCount || 0) > 1) {
    return result.rows.map((row) => snakeToCamel(row)) as unknown as T
  } else {
    return null
  }
}

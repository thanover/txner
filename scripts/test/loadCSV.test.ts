import { loadCSV } from '../utils/loadCSVFile'
import path from 'path'

test('loadCSV successfully loads CSV', async () => {
  const records = await loadCSV(path.resolve(__dirname, './input/test.csv'))
  expect(records).toEqual([{ field1: 'value1', field2: 'value2', field3: 'value3' }]);
});
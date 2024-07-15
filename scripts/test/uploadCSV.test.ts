import { uploadCSV } from '../uploadCSV'
import path from 'path'

test('uploadCSV successfully uploads CSV', async () => {
  expect(await uploadCSV(path.resolve(__dirname, './input/amazonChase-jul-24.csv'), 'AmazonChase', 'chase')).toBeTruthy();
});


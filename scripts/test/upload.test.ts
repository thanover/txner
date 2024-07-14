import { uploadCSV } from '../upload'

test('uploadCSV successfully uploads CSV', async () => {
  expect(await uploadCSV()).toBeTruthy();
});
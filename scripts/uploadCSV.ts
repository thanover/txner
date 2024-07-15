import { getTransactionRecordsFromCSVRecords } from "../csvFileMappings/csvFileMappings";
import { loadCSV } from "./utils/loadCSVFile";


// check the fields

// for each row place the fields in transaction object


export async function uploadCSV(path: string, cardName: string, bank: string) {
  // load csv file
  const csvFileContents = await loadCSV(path)
  const records = await getTransactionRecordsFromCSVRecords(csvFileContents, cardName, bank)
  console.log(records)
  return true
}
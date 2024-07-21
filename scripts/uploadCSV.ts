import { getTransactionRecordsFromCSVRecords } from "./csvFileMappings/csvFileMappings";
import { loadCSV } from "./utils/loadCSVFile";
import { TxnerApi } from "./utils/uploadTx";

// check the fields

// for each row place the fields in transaction object

export async function uploadCSV(path: string, cardName: string, bank: string) {
  // load csv file
  const csvFileContents = await loadCSV(path);
  const transactionsFromCsv = await getTransactionRecordsFromCSVRecords(
    csvFileContents,
    cardName,
    bank
  );
  console.log(`${transactionsFromCsv.length} transactions found in csv file`);
  const txnerApiClient = new TxnerApi({ env: "Dev" });
  const newTx = await txnerApiClient.createManyTx(transactionsFromCsv);
  
  console.log(JSON.stringify(newTx, null, 2));
  return true;
}

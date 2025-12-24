import { getBaseRecords } from "./lib/lark-client";
import { LARK_TABLES } from "./lib/lark-tables";

async function checkFields() {
  try {
    console.log('Fetching employee data...');
    const response = await getBaseRecords(LARK_TABLES.EMPLOYEES, { pageSize: 5 });

    console.log('Total employees:', response.data?.items?.length || 0);

    if (response.data?.items && response.data.items.length > 0) {
      console.log('\nFirst employee fields:', Object.keys(response.data.items[0].fields));
      console.log('\nAll employees data:');
      response.data.items.forEach((item: any, index: number) => {
        console.log(`\n${index + 1}. Employee:`, JSON.stringify(item.fields, null, 2));
      });
    } else {
      console.log('No employees found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFields();
